/**
 * Hyperswarm DHT Relay Server
 * 
 * Bridges browser clients to the Hyperswarm DHT network via WebSocket.
 * This allows web applications to participate in the decentralized network
 * without native socket access.
 * 
 * Based on @hyperswarm/dht-relay
 */

import { WebSocketServer, WebSocket } from 'ws';
import DHT from '@hyperswarm/dht';
import Hyperswarm from 'hyperswarm';
import { Duplex } from 'stream';
import http from 'http';
import Logs from '../logs';

const log = new Logs('dht-relay');

/**
 * Configuration for the DHT Relay Server
 */
export interface DHTRelayConfig {
  port: number;
  host?: string;
  server?: http.Server;
  bootstrap?: string[];
}

/**
 * Wraps a WebSocket connection as a Duplex stream for use with DHT relay
 */
class WebSocketStream extends Duplex {
  private ws: WebSocket;
  private isInitiator: boolean;

  constructor(isInitiator: boolean, ws: WebSocket) {
    super();
    this.isInitiator = isInitiator;
    this.ws = ws;

    ws.on('message', (data: Buffer) => {
      try {
        this.push(data);
      } catch (err) {
        log.error('Error pushing data to stream:', err);
      }
    });

    ws.on('close', () => {
      try {
        this.push(null);
        this.destroy();
      } catch (err) {
        // Ignore close errors
      }
    });

    ws.on('error', (err) => {
      log.error('WebSocket stream error:', err);
      try {
        this.destroy();
      } catch (e) {
        // Ignore destroy errors
      }
    });
    
    // Handle stream errors to prevent crashes
    this.on('error', (err) => {
      log.error('Stream error (handled):', err);
    });
  }

  _read(): void {
    // Data is pushed when received from WebSocket
  }

  _write(chunk: Buffer, encoding: string, callback: (error?: Error | null) => void): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(chunk, callback);
    } else {
      callback(new Error('WebSocket not open'));
    }
  }

  _final(callback: (error?: Error | null) => void): void {
    this.ws.close();
    callback();
  }

  _destroy(err: Error | null, callback: (error?: Error | null) => void): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
    callback(err);
  }
}

/**
 * Creates a simple relay protocol handler
 * This is a simplified version - for production use @hyperswarm/dht-relay
 */
async function createRelayHandler(dht: typeof DHT, stream: Duplex): Promise<void> {
  // For now, we'll create a simple message-based relay
  // In production, use the official @hyperswarm/dht-relay package
  
  stream.on('data', async (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'lookup':
          // Handle DHT lookup
          log.debug('DHT lookup request:', message.topic);
          // Relay lookup results back
          break;
          
        case 'announce':
          // Handle DHT announce
          log.debug('DHT announce request:', message.topic);
          break;
          
        case 'connect':
          // Handle peer connection request
          log.debug('Connect request to peer:', message.publicKey);
          break;
          
        default:
          log.warn('Unknown relay message type:', message.type);
      }
    } catch (err) {
      log.error('Error processing relay message:', err);
    }
  });
}

/**
 * DHT Relay Server class
 */
export class DHTRelayServer {
  private wss: WebSocketServer | null = null;
  private dht: typeof DHT | null = null;
  private swarm: typeof Hyperswarm | null = null;
  private config: DHTRelayConfig;
  private connections: Set<WebSocket> = new Set();

  constructor(config: DHTRelayConfig) {
    this.config = config;
  }

  /**
   * Starts the DHT relay server
   */
  async start(): Promise<void> {
    log.info('Starting DHT Relay Server...');

    // Initialize DHT node
    this.dht = new DHT({
      bootstrap: this.config.bootstrap
    });
    await this.dht.ready();
    log.info('DHT node ready');

    // Initialize Hyperswarm
    this.swarm = new Hyperswarm({ dht: this.dht });
    log.info('Hyperswarm initialized');

    // Create WebSocket server
    if (this.config.server) {
      this.wss = new WebSocketServer({ server: this.config.server });
    } else {
      this.wss = new WebSocketServer({ 
        port: this.config.port,
        host: this.config.host || '0.0.0.0'
      });
    }

    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientIP = req.socket.remoteAddress;
      log.info(`New WebSocket connection from ${clientIP}`);
      
      this.connections.add(ws);
      
      // Create duplex stream wrapper
      const stream = new WebSocketStream(false, ws);
      
      // Handle relay messages
      this.handleRelayConnection(stream, ws);
      
      ws.on('close', () => {
        log.info(`WebSocket disconnected: ${clientIP}`);
        this.connections.delete(ws);
      });

      ws.on('error', (err) => {
        // Don't log every error - many are just connection resets
        if (err.message && !err.message.includes('ECONNRESET')) {
          log.warn('WebSocket error:', err.message);
        }
        this.connections.delete(ws);
        try {
          ws.terminate();
        } catch (e) {
          // Ignore terminate errors
        }
      });
    });

    this.wss.on('error', (err) => {
      log.error('WebSocket server error:', err);
    });

    log.info(`DHT Relay Server listening on port ${this.config.port}`);
  }

  /**
   * Handles incoming relay connections
   */
  private handleRelayConnection(stream: Duplex, ws: WebSocket): void {
    // Send welcome message with server public key
    const welcomeMessage = {
      type: 'welcome',
      publicKey: this.dht?.defaultKeyPair?.publicKey?.toString('hex'),
      version: '1.0.0'
    };
    
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(welcomeMessage));
    }

    // Handle incoming messages
    stream.on('data', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        await this.handleRelayMessage(message, ws);
      } catch (err) {
        log.error('Error handling relay message:', err);
      }
    });
  }

  /**
   * Handles relay protocol messages
   */
  private async handleRelayMessage(message: any, ws: WebSocket): Promise<void> {
    switch (message.type) {
      case 'join':
        // Join a topic/swarm
        await this.handleJoinTopic(message, ws);
        break;
        
      case 'leave':
        // Leave a topic
        await this.handleLeaveTopic(message, ws);
        break;
        
      case 'lookup':
        // Lookup peers for a topic
        await this.handleLookup(message, ws);
        break;
        
      case 'connect':
        // Connect to a specific peer
        await this.handlePeerConnect(message, ws);
        break;
        
      case 'data':
        // Relay data to peer
        await this.handleDataRelay(message, ws);
        break;
        
      default:
        log.warn('Unknown message type:', message.type);
        this.sendError(ws, `Unknown message type: ${message.type}`);
    }
  }

  private async handleJoinTopic(message: any, ws: WebSocket): Promise<void> {
    if (!this.swarm || !message.topic) {
      this.sendError(ws, 'Invalid join request');
      return;
    }

    try {
      const topicBuffer = Buffer.from(message.topic, 'hex');
      const discovery = this.swarm.join(topicBuffer, { 
        server: message.server !== false,
        client: message.client !== false 
      });
      
      await discovery.flushed();
      
      this.sendMessage(ws, {
        type: 'joined',
        topic: message.topic,
        success: true
      });
      
      log.info(`Joined topic: ${message.topic.substring(0, 16)}...`);
    } catch (err) {
      log.error('Error joining topic:', err);
      this.sendError(ws, 'Failed to join topic');
    }
  }

  private async handleLeaveTopic(message: any, ws: WebSocket): Promise<void> {
    if (!this.swarm || !message.topic) return;
    
    try {
      const topicBuffer = Buffer.from(message.topic, 'hex');
      await this.swarm.leave(topicBuffer);
      
      this.sendMessage(ws, {
        type: 'left',
        topic: message.topic,
        success: true
      });
    } catch (err) {
      log.error('Error leaving topic:', err);
    }
  }

  private async handleLookup(message: any, ws: WebSocket): Promise<void> {
    if (!this.dht || !message.topic) return;
    
    try {
      const topicBuffer = Buffer.from(message.topic, 'hex');
      const peers: any[] = [];
      
      for await (const peer of this.dht.lookup(topicBuffer)) {
        peers.push({
          publicKey: peer.publicKey?.toString('hex'),
          host: peer.host,
          port: peer.port
        });
      }
      
      this.sendMessage(ws, {
        type: 'lookup_result',
        topic: message.topic,
        peers
      });
    } catch (err) {
      log.error('Error during lookup:', err);
    }
  }

  private async handlePeerConnect(message: any, ws: WebSocket): Promise<void> {
    // Peer connection relay - would bridge connections
    log.debug('Peer connect request:', message);
  }

  private async handleDataRelay(message: any, ws: WebSocket): Promise<void> {
    // Data relay between peers
    log.debug('Data relay:', message);
  }

  private sendMessage(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, error: string): void {
    this.sendMessage(ws, { type: 'error', error });
  }

  /**
   * Stops the DHT relay server
   */
  async stop(): Promise<void> {
    log.info('Stopping DHT Relay Server...');
    
    // Close all connections
    for (const ws of this.connections) {
      ws.close();
    }
    this.connections.clear();
    
    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    
    // Destroy swarm
    if (this.swarm) {
      await this.swarm.destroy();
      this.swarm = null;
    }
    
    // Destroy DHT
    if (this.dht) {
      await this.dht.destroy();
      this.dht = null;
    }
    
    log.info('DHT Relay Server stopped');
  }

  /**
   * Gets the number of active connections
   */
  getConnectionCount(): number {
    return this.connections.size;
  }
}

/**
 * Starts a standalone DHT relay server
 */
export async function startDHTRelayServer(config: DHTRelayConfig): Promise<DHTRelayServer> {
  const server = new DHTRelayServer(config);
  await server.start();
  return server;
}

export default DHTRelayServer;
