/**
 * Mediasoup-based SFU (Selective Forwarding Unit)
 * 
 * Handles large group video calls (8-1000+ participants).
 * Each participant sends one stream, SFU forwards to all others.
 * Scales linearly with participants instead of exponentially.
 */

import { Server } from 'socket.io';
import { createWorker, types as mediasoupTypes } from 'mediasoup';
import Logs from '../logs';

const log = new Logs('mediasoup-sfu');

/**
 * SFU Configuration
 */
export interface SFUConfig {
  listenIp: string;
  announcedIp?: string;
  minPort: number;
  maxPort: number;
  maxIncomingBitrate?: number;
}

/**
 * Room state for SFU
 */
interface SFURoom {
  id: string;
  router: mediasoupTypes.Router | null;
  peers: Map<string, SFUPeer>;
  createdAt: Date;
}

/**
 * Peer state in SFU room
 */
interface SFUPeer {
  id: string;
  displayName?: string;
  transports: Map<string, mediasoupTypes.WebRtcTransport>;
  producers: Map<string, mediasoupTypes.Producer>;
  consumers: Map<string, mediasoupTypes.Consumer>;
}

/**
 * Media codecs supported by the SFU
 */
const mediaCodecs: mediasoupTypes.RtpCodecCapability[] = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    parameters: {
      'x-google-start-bitrate': 1000
    }
  },
  {
    kind: 'video',
    mimeType: 'video/VP9',
    clockRate: 90000,
    parameters: {
      'profile-id': 2,
      'x-google-start-bitrate': 1000
    }
  },
  {
    kind: 'video',
    mimeType: 'video/H264',
    clockRate: 90000,
    parameters: {
      'packetization-mode': 1,
      'profile-level-id': '4d0032',
      'level-asymmetry-allowed': 1,
      'x-google-start-bitrate': 1000
    }
  }
];

/**
 * Default SFU configuration
 */
const DEFAULT_CONFIG: SFUConfig = {
  listenIp: '0.0.0.0',
  minPort: 10000,
  maxPort: 10100,
  maxIncomingBitrate: 1500000
};

/**
 * Mediasoup SFU Server
 */
export class MediasoupSFU {
  private config: SFUConfig;
  private worker: mediasoupTypes.Worker | null = null;
  private rooms: Map<string, SFURoom> = new Map();
  private io: Server | null = null;
  private isInitialized = false;

  constructor(config?: Partial<SFUConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initializes the SFU with a Socket.io server
   */
  async initialize(io: Server): Promise<void> {
    if (this.isInitialized) return;

    log.info('Initializing Mediasoup SFU...');
    this.io = io;

    try {
      // Create mediasoup worker
      this.worker = await createWorker({
        logLevel: 'warn',
        rtcMinPort: this.config.minPort,
        rtcMaxPort: this.config.maxPort
      });

      this.worker.on('died', () => {
        log.error('Mediasoup worker died, restarting...');
        setTimeout(() => this.initialize(io), 2000);
      });

      // Set up Socket.io handlers
      this.setupSocketHandlers();

      this.isInitialized = true;
      log.info('Mediasoup SFU initialized');
    } catch (error) {
      log.error('Failed to initialize SFU:', error);
      throw error;
    }
  }

  /**
   * Creates a new SFU room
   */
  async createRoom(roomId: string): Promise<SFURoom> {
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId)!;
    }

    if (!this.worker) {
      throw new Error('SFU not initialized');
    }

    log.info(`Creating SFU room: ${roomId}`);

    const router = await this.worker.createRouter({ mediaCodecs });

    const room: SFURoom = {
      id: roomId,
      router,
      peers: new Map(),
      createdAt: new Date()
    };

    this.rooms.set(roomId, room);
    return room;
  }

  /**
   * Closes a room and releases resources
   */
  async closeRoom(roomId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) return;

    log.info(`Closing SFU room: ${roomId}`);

    // Close all peer transports
    for (const [peerId, peer] of room.peers) {
      for (const [, transport] of peer.transports) {
        transport.close();
      }
    }

    // Close router
    room.router?.close();
    this.rooms.delete(roomId);
  }

  /**
   * Gets room statistics
   */
  getRoomStats(roomId: string): { peerCount: number; producerCount: number; consumerCount: number } | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    let producerCount = 0;
    let consumerCount = 0;

    for (const [, peer] of room.peers) {
      producerCount += peer.producers.size;
      consumerCount += peer.consumers.size;
    }

    return {
      peerCount: room.peers.size,
      producerCount,
      consumerCount
    };
  }

  /**
   * Sets up Socket.io handlers for SFU signaling
   */
  private setupSocketHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      log.debug(`New SFU connection: ${socket.id}`);

      // Get router RTP capabilities
      socket.on('sfu:getRouterCapabilities', async ({ roomId }, callback) => {
        try {
          const room = await this.createRoom(roomId);
          callback({ rtpCapabilities: room.router?.rtpCapabilities });
        } catch (error) {
          callback({ error: (error as Error).message });
        }
      });

      // Create WebRTC transport for sending
      socket.on('sfu:createSendTransport', async ({ roomId }, callback) => {
        try {
          const transport = await this.createWebRtcTransport(roomId, socket.id, 'send');
          callback({
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters
          });
        } catch (error) {
          callback({ error: (error as Error).message });
        }
      });

      // Create WebRTC transport for receiving
      socket.on('sfu:createRecvTransport', async ({ roomId }, callback) => {
        try {
          const transport = await this.createWebRtcTransport(roomId, socket.id, 'recv');
          callback({
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters
          });
        } catch (error) {
          callback({ error: (error as Error).message });
        }
      });

      // Connect transport
      socket.on('sfu:connectTransport', async ({ roomId, transportId, dtlsParameters }, callback) => {
        try {
          const room = this.rooms.get(roomId);
          const peer = room?.peers.get(socket.id);
          const transport = peer?.transports.get(transportId);

          if (!transport) {
            throw new Error('Transport not found');
          }

          await transport.connect({ dtlsParameters });
          callback({ success: true });
        } catch (error) {
          callback({ error: (error as Error).message });
        }
      });

      // Start producing (sending media)
      socket.on('sfu:produce', async ({ roomId, transportId, kind, rtpParameters, appData }, callback) => {
        try {
          const room = this.rooms.get(roomId);
          const peer = room?.peers.get(socket.id);
          const transport = peer?.transports.get(transportId);

          if (!transport) {
            throw new Error('Transport not found');
          }

          const producer = await transport.produce({
            kind,
            rtpParameters,
            appData
          });

          peer!.producers.set(producer.id, producer);

          // Notify other peers about new producer
          socket.to(roomId).emit('sfu:newProducer', {
            peerId: socket.id,
            producerId: producer.id,
            kind
          });

          callback({ id: producer.id });
        } catch (error) {
          callback({ error: (error as Error).message });
        }
      });

      // Start consuming (receiving media)
      socket.on('sfu:consume', async ({ roomId, producerId, rtpCapabilities }, callback) => {
        try {
          const room = this.rooms.get(roomId);
          const peer = room?.peers.get(socket.id);

          if (!room?.router || !peer) {
            throw new Error('Room or peer not found');
          }

          // Check if we can consume
          if (!room.router.canConsume({ producerId, rtpCapabilities })) {
            throw new Error('Cannot consume this producer');
          }

          // Get receive transport
          const transport = Array.from(peer.transports.values())
            .find(t => t.appData.direction === 'recv');

          if (!transport) {
            throw new Error('No receive transport found');
          }

          const consumer = await transport.consume({
            producerId,
            rtpCapabilities,
            paused: true // Start paused
          });

          peer.consumers.set(consumer.id, consumer);

          callback({
            id: consumer.id,
            producerId,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters
          });
        } catch (error) {
          callback({ error: (error as Error).message });
        }
      });

      // Resume consumer
      socket.on('sfu:resumeConsumer', async ({ roomId, consumerId }, callback) => {
        try {
          const room = this.rooms.get(roomId);
          const peer = room?.peers.get(socket.id);
          const consumer = peer?.consumers.get(consumerId);

          if (!consumer) {
            throw new Error('Consumer not found');
          }

          await consumer.resume();
          callback({ success: true });
        } catch (error) {
          callback({ error: (error as Error).message });
        }
      });

      // Join room
      socket.on('sfu:join', async ({ roomId, displayName }, callback) => {
        try {
          const room = await this.createRoom(roomId);

          // Create peer entry
          const peer: SFUPeer = {
            id: socket.id,
            displayName,
            transports: new Map(),
            producers: new Map(),
            consumers: new Map()
          };

          room.peers.set(socket.id, peer);
          socket.join(roomId);

          // Get existing producers to consume
          const existingProducers: { peerId: string; producerId: string; kind: string }[] = [];
          for (const [peerId, existingPeer] of room.peers) {
            if (peerId !== socket.id) {
              for (const [producerId, producer] of existingPeer.producers) {
                existingProducers.push({
                  peerId,
                  producerId,
                  kind: producer.kind
                });
              }
            }
          }

          callback({
            rtpCapabilities: room.router?.rtpCapabilities,
            existingProducers
          });

          // Notify others
          socket.to(roomId).emit('sfu:peerJoined', {
            peerId: socket.id,
            displayName
          });

          log.info(`Peer ${socket.id} joined SFU room ${roomId}`);
        } catch (error) {
          callback({ error: (error as Error).message });
        }
      });

      // Leave room
      socket.on('sfu:leave', async ({ roomId }) => {
        await this.handlePeerLeave(roomId, socket.id);
        socket.to(roomId).emit('sfu:peerLeft', { peerId: socket.id });
      });

      // Handle disconnect
      socket.on('disconnect', async () => {
        // Clean up from all rooms
        for (const [roomId, room] of this.rooms) {
          if (room.peers.has(socket.id)) {
            await this.handlePeerLeave(roomId, socket.id);
            socket.to(roomId).emit('sfu:peerLeft', { peerId: socket.id });
          }
        }
      });
    });
  }

  /**
   * Creates a WebRTC transport
   */
  private async createWebRtcTransport(
    roomId: string,
    peerId: string,
    direction: 'send' | 'recv'
  ): Promise<mediasoupTypes.WebRtcTransport> {
    const room = this.rooms.get(roomId);
    if (!room?.router) {
      throw new Error('Room not found');
    }

    const transport = await room.router.createWebRtcTransport({
      listenIps: [
        {
          ip: this.config.listenIp,
          announcedIp: this.config.announcedIp
        }
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: this.config.maxIncomingBitrate,
      appData: { direction }
    });

    // Set max incoming bitrate
    if (this.config.maxIncomingBitrate) {
      await transport.setMaxIncomingBitrate(this.config.maxIncomingBitrate);
    }

    // Get or create peer
    let peer = room.peers.get(peerId);
    if (!peer) {
      peer = {
        id: peerId,
        transports: new Map(),
        producers: new Map(),
        consumers: new Map()
      };
      room.peers.set(peerId, peer);
    }

    peer.transports.set(transport.id, transport);

    return transport;
  }

  /**
   * Handles peer leaving
   */
  private async handlePeerLeave(roomId: string, peerId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const peer = room.peers.get(peerId);
    if (!peer) return;

    log.info(`Peer ${peerId} leaving SFU room ${roomId}`);

    // Close all transports (this also closes producers/consumers)
    for (const [, transport] of peer.transports) {
      transport.close();
    }

    room.peers.delete(peerId);

    // If room is empty, close it
    if (room.peers.size === 0) {
      await this.closeRoom(roomId);
    }
  }

  /**
   * Shuts down the SFU
   */
  async shutdown(): Promise<void> {
    log.info('Shutting down Mediasoup SFU...');

    // Close all rooms
    for (const [roomId] of this.rooms) {
      await this.closeRoom(roomId);
    }

    // Close worker
    this.worker?.close();
    this.worker = null;
    this.isInitialized = false;

    log.info('Mediasoup SFU shut down');
  }
}

export default MediasoupSFU;
