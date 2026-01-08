/// <reference types="node" />
import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';
import crypto from 'crypto';
import express, { Express, Request, Response, NextFunction } from 'express';
import { Server, Socket } from 'socket.io';
import compression from 'compression';
import cors from 'cors';
import * as configModule from './config/index';
const config = (configModule as any).default;
import checkXSS from './xss';
import Host from './host';
import Logs from './logs';
import { DHTRelayServer } from './hypernat/dht-relay-server';
import { getPeerGeoLocation, GeoLocationResponse } from './utils/api';
import dataroomRoutes, { initializeDataRoomService } from './api/dataroom-routes';

interface PeerData {
  peer_name: string;
  peer_audio: boolean;
  peer_video: boolean;
  peer_screen: boolean;
  peer_hand: boolean;
  peer_rec: boolean;
  peer_geo?: GeoLocationResponse | null;
}

interface JoinConfig extends PeerData {
  channel: string;
  ipLookup: { enabled: boolean };
}

interface IceRelayConfig {
  peer_id: string;
  ice_candidate: RTCIceCandidate;
}

interface SdpRelayConfig {
  peer_id: string;
  session_description: RTCSessionDescriptionInit;
}

interface Channels {
  [channelId: string]: { [socketId: string]: Socket };
}

interface Sockets {
  [socketId: string]: Socket & { channels?: { [channelId: string]: string } };
}

interface Peers {
  [channelId: string]: { [socketId: string]: PeerData };
}

const log = new Logs('server');
const app: Express = express();

let server: http.Server | https.Server;
let io: Server;
let authHost: Host;

const start = async (): Promise<void> => {
  try {
    log.info('Starting Pigeon server...');
    config.utils.setupSentry(config);

    // await startHypernatServer().catch((err: Error) => log.error('Failed to start HyperNAT server', err));

    if (config.server.isHttps) {
      const keyPath = path.join(__dirname, '../ssl/key.pem');
      const certPath = path.join(__dirname, '../ssl/cert.pem');
      if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
        log.error('SSL key or certificate file not found:', { keyPath, certPath });
        process.exit(1);
      }
      const options = {
        key: fs.readFileSync(keyPath, 'utf-8'),
        cert: fs.readFileSync(certPath, 'utf-8'),
      };
      server = https.createServer(options, app);
      log.info('HTTPS server created.');
    } else {
      server = http.createServer(app);
      log.info('HTTP server created.');
    }

    io = new Server(server, {
      maxHttpBufferSize: 1e7, // 10 MB
      cors: { origin: '*' },
    });

    let authenticated = !config.host.protected;
    if (config.host.protected) {
      authHost = new Host('server-protected', true);
    }

    const channels: Channels = {};
    const sockets: Sockets = {};
    const peers: Peers = {};

    app.use(cors());
    app.use(compression());
    app.use(express.json());
    app.use(express.static(config.paths.public));

    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      if (err instanceof SyntaxError && 'body' in err) {
        log.error('Request Error', { error: err.message });
        return res.status(400).send({ status: 400, message: 'Malformed JSON.' });
      }
      next(err);
    });

    app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ status: 'ok' });
    });

    app.get(['/', '/new'], (req: Request, res: Response) => {
      if (authenticated) {
        res.sendFile(config.paths.views.main);
      } else {
        res.sendFile(config.paths.views.password);
      }
    });

    app.post('/', (req: Request, res: Response) => {
      const { password } = checkXSS(req.body);
      if (password === config.host.password) {
        if (req.ip) authHost.isAuthorized(req.ip);
        authenticated = true;
        res.redirect('/');
      } else {
        res.sendFile(config.paths.views.password);
      }
    });

    app.get(['/privacy', '/terms', '/test'], (req: Request, res: Response) => {
      if (req.path === '/privacy') res.sendFile(config.paths.views.privacy);
      else if (req.path === '/terms') res.sendFile(config.paths.views.terms);
      else res.sendFile(config.paths.views.stunTurn);
    });

    app.get('/join/:roomId', (req: Request, res: Response) => {
      if (authenticated) {
        res.sendFile(config.paths.views.client);
      } else {
        res.redirect('/');
      }
    });

    app.post(`${config.api.basePath}/meeting`, (req: Request, res: Response) => {
      const apiKey = req.headers.authorization;
      if (!apiKey || apiKey !== `Bearer ${config.api.apiKeySecret}`) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
      }
      try {
        const host = req.headers.host || 'localhost';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const meetingId = crypto.randomBytes(16).toString('hex');
        const meetingURL = `${protocol}://${host}/join/${meetingId}`;
        res.status(201).json({ meeting: meetingURL });
      } catch (error) {
        log.error('Error creating meeting room', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    // Meeting validation endpoint
    app.get(`${config.api.basePath}/meeting/validate/:meetingId`, (req: Request, res: Response) => {
      const apiKey = req.headers.authorization;
      if (!apiKey || apiKey !== `Bearer ${config.api.apiKeySecret}`) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
      }
      try {
        const { meetingId } = req.params;
        // Basic validation - in a real implementation, you'd check if the meeting exists
        if (meetingId && meetingId.length > 0) {
          res.status(200).json({ 
            valid: true, 
            meetingId,
            message: 'Meeting ID is valid'
          });
        } else {
          res.status(400).json({ 
            valid: false, 
            error: 'Invalid meeting ID format'
          });
        }
      } catch (error) {
        log.error('Error validating meeting', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    // Data Room API routes (Hyperdrive-based file sharing)
    app.use(`${config.api.basePath}/dataroom`, dataroomRoutes);

    app.get('*', (req: Request, res: Response) => {
      res.status(404).sendFile(config.paths.views.notFound);
    });

    io.on('connection', (socket: Socket) => {
      log.info(`Socket.IO connection: ${socket.id} from ${socket.handshake.address}`);
      sockets[socket.id] = socket;
      sockets[socket.id].channels = {};

      socket.on('join', async (joinConfig: JoinConfig) => {
        try {
          const peer_ip = socket.handshake.address;
          if (joinConfig.ipLookup.enabled && peer_ip !== '::1') {
            joinConfig.peer_geo = await getPeerGeoLocation(peer_ip);
          }
          const { channel } = joinConfig;
          if (sockets[socket.id]?.channels?.[channel]) return;

          if (!channels[channel]) {
            channels[channel] = {};
            peers[channel] = {};
          }

          peers[channel][socket.id] = joinConfig;

          for (const id in channels[channel]) {
            channels[channel][id].emit('addPeer', { peer_id: socket.id, peers: peers[channel], should_create_offer: false });
            socket.emit('addPeer', { peer_id: id, peers: peers[channel], should_create_offer: true });
          }

          channels[channel][socket.id] = socket;
          if (sockets[socket.id].channels) {
            sockets[socket.id].channels![channel] = channel;
          }
        } catch (err) {
          log.error('Error in join handler', err);
        }
      });

      const removePeerFrom = (channel: string) => {
        if (!channels[channel]) return;
        delete channels[channel][socket.id];
        delete peers[channel][socket.id];
        for (const id in channels[channel]) {
          channels[channel][id].emit('removePeer', { peer_id: socket.id });
          socket.emit('removePeer', { peer_id: id });
        }
      };

      socket.on('relayICE', (config: IceRelayConfig) => {
        try {
          const { peer_id, ice_candidate } = config;
          if (sockets[peer_id]) {
            sockets[peer_id].emit('iceCandidate', { peer_id: socket.id, ice_candidate });
          }
        } catch (err) {
          log.error('Error in relayICE handler', err);
        }
      });

      socket.on('relaySDP', (config: SdpRelayConfig) => {
        try {
          const { peer_id, session_description } = config;
          if (sockets[peer_id]) {
            sockets[peer_id].emit('sessionDescription', { peer_id: socket.id, session_description });
          }
        } catch (err) {
          log.error('Error in relaySDP handler', err);
        }
      });

      socket.on('disconnect', () => {
        try {
          if (sockets[socket.id]?.channels) {
            for (const channel in sockets[socket.id].channels) {
              removePeerFrom(channel);
            }
          }
          delete sockets[socket.id];
        } catch (err) {
          log.error('Error in disconnect handler', err);
        }
      });
    });

    server.listen(config.server.port, async () => {
      log.info(`Pigeon server running on port ${config.server.port}`);
      log.info(`API Key for development: ${config.api.apiKeySecret}`);
      
      // Pre-initialize Hyperdrive Manager so data room creation is instant
      try {
        await initializeDataRoomService();
        log.info('Data Room service ready');
      } catch (err) {
        log.warn('Data Room service initialization deferred:', err);
      }
      
      // Start DHT Relay Server for browser Hyperswarm support
      try {
        const dhtRelayPort = config.server.port + 1; // e.g., 3061 if main is 3060
        const dhtRelay = new DHTRelayServer({
          port: dhtRelayPort,
          server: server as http.Server // Attach to same HTTP server
        });
        await dhtRelay.start();
        log.info(`DHT Relay Server running on port ${dhtRelayPort}`);
      } catch (err) {
        log.warn('DHT Relay Server failed to start (optional for WebRTC mode):', err);
      }
      
      await config.utils.startNgrok(config, config.server.port, log);
    });
  } catch (err) {
    log.error('Fatal error during server startup', err);
    process.exit(1);
  }
};

start();

// Graceful shutdown logic
const gracefulShutdown = (signal: string) => {
  process.on(signal, () => {
    log.info(`Received ${signal}, shutting down...`);
    if (server) {
      server.close(() => {
        log.info('Server closed.');
        process.exit(0);
      });
    }
  });
};

gracefulShutdown('SIGINT');
gracefulShutdown('SIGTERM');
