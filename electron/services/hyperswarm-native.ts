/**
 * Native Hyperswarm Service for Electron
 * 
 * Provides direct DHT connections for true P2P communication
 * without relying on signaling servers.
 */
import DHT from '@hyperswarm/dht';
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

export interface HyperswarmPeer {
  id: string;
  publicKey: Buffer;
  remotePublicKey: Buffer;
  socket: any;
  isInitiator: boolean;
}

export interface HyperswarmRoom {
  id: string;
  topic: Buffer;
  peers: Map<string, HyperswarmPeer>;
  server: any;
}

export interface HyperswarmConfig {
  bootstrap?: string[];
  keyPair?: { publicKey: Buffer; secretKey: Buffer };
}

export class HyperswarmNative extends EventEmitter {
  private dht: any;
  private keyPair: { publicKey: Buffer; secretKey: Buffer };
  private rooms: Map<string, HyperswarmRoom> = new Map();
  private isConnected: boolean = false;

  constructor(config?: HyperswarmConfig) {
    super();
    
    // Generate or use provided keypair
    this.keyPair = config?.keyPair || DHT.keyPair();
    
    // Initialize DHT
    this.dht = new DHT({
      bootstrap: config?.bootstrap,
      keyPair: this.keyPair
    });
  }

  /**
   * Get the public key as hex string
   */
  getPublicKey(): string {
    return this.keyPair.publicKey.toString('hex');
  }

  /**
   * Get the public key as buffer
   */
  getPublicKeyBuffer(): Buffer {
    return this.keyPair.publicKey;
  }

  /**
   * Connect to the DHT network
   */
  async connect(): Promise<void> {
    if (this.isConnected) return;

    await this.dht.ready();
    this.isConnected = true;
    this.emit('connected', this.getPublicKey());
    console.log('Hyperswarm DHT connected:', this.getPublicKey());
  }

  /**
   * Disconnect from the DHT network
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    // Close all rooms
    for (const [roomId, room] of this.rooms) {
      await this.leaveRoom(roomId);
    }

    await this.dht.destroy();
    this.isConnected = false;
    this.emit('disconnected');
    console.log('Hyperswarm DHT disconnected');
  }

  /**
   * Create a room topic from a room ID
   */
  private createTopic(roomId: string): Buffer {
    return crypto.createHash('sha256').update(roomId).digest();
  }

  /**
   * Create and announce a room
   */
  async createRoom(roomId: string): Promise<HyperswarmRoom> {
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId)!;
    }

    const topic = this.createTopic(roomId);
    
    // Create a server that listens for connections on this topic
    const server = this.dht.createServer((socket: any) => {
      this.handleIncomingConnection(roomId, socket);
    });

    await server.listen(this.keyPair);

    // Announce to the topic
    await this.dht.announce(topic, this.keyPair);

    const room: HyperswarmRoom = {
      id: roomId,
      topic,
      peers: new Map(),
      server
    };

    this.rooms.set(roomId, room);
    this.emit('roomCreated', room);
    console.log('Room created:', roomId);

    return room;
  }

  /**
   * Join an existing room by connecting to peers
   */
  async joinRoom(roomId: string): Promise<HyperswarmRoom> {
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId)!;
    }

    const topic = this.createTopic(roomId);

    const room: HyperswarmRoom = {
      id: roomId,
      topic,
      peers: new Map(),
      server: null
    };

    this.rooms.set(roomId, room);

    // Look up peers on this topic
    const lookup = this.dht.lookup(topic);

    lookup.on('peer', async (peer: any) => {
      try {
        const socket = this.dht.connect(peer.publicKey);
        await this.handleOutgoingConnection(roomId, socket, peer.publicKey);
      } catch (error) {
        console.error('Failed to connect to peer:', error);
      }
    });

    this.emit('roomJoined', room);
    console.log('Joined room:', roomId);

    return room;
  }

  /**
   * Leave a room
   */
  async leaveRoom(roomId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // Close all peer connections
    for (const [peerId, peer] of room.peers) {
      peer.socket.destroy();
    }
    room.peers.clear();

    // Close server if we created one
    if (room.server) {
      await room.server.close();
    }

    // Unannounce from topic
    await this.dht.unannounce(room.topic, this.keyPair);

    this.rooms.delete(roomId);
    this.emit('roomLeft', roomId);
    console.log('Left room:', roomId);
  }

  /**
   * Handle incoming peer connection
   */
  private handleIncomingConnection(roomId: string, socket: any): void {
    const room = this.rooms.get(roomId);
    if (!room) {
      socket.destroy();
      return;
    }

    const remotePublicKey = socket.remotePublicKey;
    const peerId = remotePublicKey.toString('hex');

    const peer: HyperswarmPeer = {
      id: peerId,
      publicKey: this.keyPair.publicKey,
      remotePublicKey,
      socket,
      isInitiator: false
    };

    room.peers.set(peerId, peer);
    this.setupSocketHandlers(roomId, peer);
    this.emit('peerConnected', roomId, peer);
    console.log('Peer connected (incoming):', peerId.substring(0, 16));
  }

  /**
   * Handle outgoing peer connection
   */
  private async handleOutgoingConnection(
    roomId: string, 
    socket: any, 
    remotePublicKey: Buffer
  ): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) {
      socket.destroy();
      return;
    }

    const peerId = remotePublicKey.toString('hex');

    // Don't connect to ourselves
    if (peerId === this.getPublicKey()) return;

    // Don't duplicate connections
    if (room.peers.has(peerId)) return;

    const peer: HyperswarmPeer = {
      id: peerId,
      publicKey: this.keyPair.publicKey,
      remotePublicKey,
      socket,
      isInitiator: true
    };

    room.peers.set(peerId, peer);
    this.setupSocketHandlers(roomId, peer);
    this.emit('peerConnected', roomId, peer);
    console.log('Peer connected (outgoing):', peerId.substring(0, 16));
  }

  /**
   * Setup socket event handlers for a peer
   */
  private setupSocketHandlers(roomId: string, peer: HyperswarmPeer): void {
    const socket = peer.socket;

    socket.on('data', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.emit('message', roomId, peer.id, message);
      } catch {
        // Binary data
        this.emit('data', roomId, peer.id, data);
      }
    });

    socket.on('close', () => {
      const room = this.rooms.get(roomId);
      if (room) {
        room.peers.delete(peer.id);
      }
      this.emit('peerDisconnected', roomId, peer.id);
      console.log('Peer disconnected:', peer.id.substring(0, 16));
    });

    socket.on('error', (error: Error) => {
      console.error('Socket error:', error);
      this.emit('peerError', roomId, peer.id, error);
    });
  }

  /**
   * Send a message to all peers in a room
   */
  broadcast(roomId: string, message: object | string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const data = typeof message === 'string' ? message : JSON.stringify(message);

    for (const peer of room.peers.values()) {
      try {
        peer.socket.write(data);
      } catch (error) {
        console.error('Failed to send to peer:', peer.id.substring(0, 16));
      }
    }
  }

  /**
   * Send a message to a specific peer
   */
  sendToPeer(roomId: string, peerId: string, message: object | string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const peer = room.peers.get(peerId);
    if (!peer) return;

    const data = typeof message === 'string' ? message : JSON.stringify(message);
    peer.socket.write(data);
  }

  /**
   * Send binary data to a specific peer
   */
  sendDataToPeer(roomId: string, peerId: string, data: Buffer): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const peer = room.peers.get(peerId);
    if (!peer) return;

    peer.socket.write(data);
  }

  /**
   * Get all peers in a room
   */
  getPeers(roomId: string): HyperswarmPeer[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.peers.values());
  }

  /**
   * Get all rooms
   */
  getRooms(): HyperswarmRoom[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Check if connected to DHT
   */
  isReady(): boolean {
    return this.isConnected;
  }
}

export default HyperswarmNative;
