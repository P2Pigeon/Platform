/**
 * P2Pigeon - Secure P2P Communication Platform
 * 
 * @license AGPL-3.0 - https://opensource.org/licenses/AGPL-3.0
 * @copyright 2024-2026 P2Pigeon Contributors
 * @see https://github.com/p2pigeon/platform
 * 
 * Last updated: 2026-01-07
 */

/**
 * Serverless Mesh Adapter
 * 
 * Implements the ProtocolAdapter interface using ServerlessVideoMesh
 * for fully decentralized, serverless video calls with 100+ participants.
 */

import { 
  ConnectionStatus, 
  CommunicationProtocol, 
  Peer, 
  Message, 
  FileMetadata,
  Room,
  RoomId,
  PeerId,
  FileId,
  MessageId,
  HyperswarmConfig
} from '../../types/core';
import { ProtocolAdapter, ProtocolEvents } from './ProtocolAdapter';
import { ServerlessVideoMesh, VideoQuality } from './ServerlessVideoMesh';

/**
 * Configuration for the serverless mesh adapter
 */
export interface ServerlessMeshConfig extends HyperswarmConfig {
  displayName?: string;
  enableSimulcast?: boolean;
  enableVAD?: boolean;
  preferredCodec?: 'av1' | 'vp9' | 'vp8' | 'h264';
  maxBitrate?: number;
}

/**
 * ServerlessMeshAdapter - Implements ProtocolAdapter for serverless P2P video
 */
export class ServerlessMeshAdapter implements ProtocolAdapter {
  readonly protocolType = CommunicationProtocol.HYPERSWARM;

  private mesh: ServerlessVideoMesh | null = null;
  private config: ServerlessMeshConfig | null = null;
  private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private localPeer: Peer | null = null;
  private peers: Map<string, Peer> = new Map();
  private rooms: Map<RoomId, Room> = new Map();
  private currentRoomId: RoomId | null = null;
  private eventHandlers: Partial<Record<keyof ProtocolEvents, Set<Function>>> = {};
  private messages: Map<RoomId, Message[]> = new Map();
  private files: Map<RoomId, FileMetadata[]> = new Map();

  constructor() {
    console.log('[ServerlessMesh] Adapter created');
  }

  /**
   * Initialize the adapter with configuration
   */
  async initialize(config: ServerlessMeshConfig | Record<string, unknown>): Promise<void> {
    console.log('[ServerlessMesh] Initializing with config:', config);

    this.config = config as ServerlessMeshConfig;

    // Determine relay URL - use env var, config, or default based on current location
    const defaultRelayUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/dht-relay`
      : 'ws://localhost:3051';
    
    // Create the mesh instance
    this.mesh = new ServerlessVideoMesh({
      relayUrl: this.config.relayUrl || import.meta.env.VITE_DHT_RELAY_URL || defaultRelayUrl,
      enableSimulcast: this.config.enableSimulcast ?? true,
      enableVAD: this.config.enableVAD ?? true,
      preferredCodec: this.config.preferredCodec || 'vp9',
      maxBitrate: this.config.maxBitrate || 8_000_000
    });

    // Set up mesh event handlers
    this.setupMeshEventHandlers();

    // Create local peer
    this.localPeer = {
      id: this.mesh.getLocalPeerId() as PeerId,
      displayName: this.config.displayName || `Peer-${this.mesh.getLocalPeerId().substring(0, 8)}`,
      connectionStatus: ConnectionStatus.DISCONNECTED,
      isLocal: true,
      protocolType: CommunicationProtocol.HYPERSWARM,
      publicKey: this.mesh.getLocalPeerId(),
      audioEnabled: true,
      videoEnabled: true
    };

    this.connectionStatus = ConnectionStatus.DISCONNECTED;
    console.log('[ServerlessMesh] Initialized');
  }

  /**
   * Sets up event handlers for the mesh
   */
  private setupMeshEventHandlers(): void {
    if (!this.mesh) return;

    this.mesh.on('onPeerJoined', (peerId, displayName) => {
      console.log('[ServerlessMesh] Peer joined:', peerId);
      
      const peer: Peer = {
        id: peerId as PeerId,
        displayName: displayName || `Peer-${peerId.substring(0, 8)}`,
        connectionStatus: ConnectionStatus.CONNECTED,
        isLocal: false,
        protocolType: CommunicationProtocol.HYPERSWARM,
        publicKey: peerId,
        audioEnabled: true,
        videoEnabled: true
      };

      this.peers.set(peerId, peer);
      this.triggerEvent('onPeerConnect', peer);
    });

    this.mesh.on('onPeerLeft', (peerId) => {
      console.log('[ServerlessMesh] Peer left:', peerId);
      this.peers.delete(peerId);
      this.triggerEvent('onPeerDisconnect', peerId as PeerId);
    });

    this.mesh.on('onRemoteStream', (peerId, stream, quality) => {
      console.log('[ServerlessMesh] Remote stream from:', peerId, 'quality:', quality);
      this.triggerEvent('onRemoteStreamAdded', peerId as PeerId, stream);
    });

    this.mesh.on('onRemoteStreamRemoved', (peerId) => {
      console.log('[ServerlessMesh] Remote stream removed:', peerId);
      this.triggerEvent('onRemoteStreamRemoved', peerId as PeerId);
    });

    this.mesh.on('onActiveSpeakerChange', (speakerIds) => {
      console.log('[ServerlessMesh] Active speakers:', speakerIds);
      // Track active speakers - peers are immutable so we just log for now
      // UI components should use getActiveSpeakers() to check speaker status
    });

    this.mesh.on('onConnectionStateChange', (state) => {
      console.log('[ServerlessMesh] Connection state:', state);
      
      switch (state) {
        case 'connecting':
          this.connectionStatus = ConnectionStatus.CONNECTING;
          break;
        case 'connected':
          this.connectionStatus = ConnectionStatus.CONNECTED;
          if (this.localPeer) {
            this.localPeer.connectionStatus = ConnectionStatus.CONNECTED;
          }
          break;
        case 'disconnected':
          this.connectionStatus = ConnectionStatus.DISCONNECTED;
          if (this.localPeer) {
            this.localPeer.connectionStatus = ConnectionStatus.DISCONNECTED;
          }
          break;
      }
    });

    this.mesh.on('onError', (error) => {
      console.error('[ServerlessMesh] Error:', error);
      this.triggerEvent('onError', error);
    });

    this.mesh.on('onStats', (stats) => {
      console.log('[ServerlessMesh] Stats:', stats);
    });
  }

  /**
   * Connect to the DHT relay
   */
  async connect(): Promise<void> {
    console.log('[ServerlessMesh] Connecting...');
    this.connectionStatus = ConnectionStatus.CONNECTING;
    
    // The actual connection happens when joining a room
    // For now, just mark as ready
    this.connectionStatus = ConnectionStatus.CONNECTED;
    
    if (this.localPeer) {
      this.localPeer.connectionStatus = ConnectionStatus.CONNECTED;
    }
    
    console.log('[ServerlessMesh] Connected (ready to join rooms)');
  }

  /**
   * Disconnect from all rooms and clean up
   */
  async disconnect(): Promise<void> {
    console.log('[ServerlessMesh] Disconnecting...');
    
    if (this.mesh && this.currentRoomId) {
      await this.mesh.leaveRoom();
    }
    
    this.mesh?.stopLocalMedia();
    this.connectionStatus = ConnectionStatus.DISCONNECTED;
    
    if (this.localPeer) {
      this.localPeer.connectionStatus = ConnectionStatus.DISCONNECTED;
    }
    
    this.peers.clear();
    this.rooms.clear();
    this.currentRoomId = null;
    
    console.log('[ServerlessMesh] Disconnected');
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Get the local peer
   */
  getCurrentPeer(): Peer {
    if (!this.localPeer) {
      throw new Error('Adapter not initialized');
    }
    return this.localPeer;
  }

  /**
   * Get all connected peers
   */
  getPeers(): Peer[] {
    return Array.from(this.peers.values());
  }

  /**
   * Create a new room
   */
  async createRoom(options?: Record<string, unknown>): Promise<Room> {
    if (!this.mesh) {
      throw new Error('Adapter not initialized');
    }

    const roomId = options?.roomId as string || crypto.randomUUID();
    console.log('[ServerlessMesh] Creating room:', roomId);

    // Start local media first
    await this.mesh.startLocalMedia();

    // Join the room (in P2P, creating = joining first)
    await this.mesh.joinRoom(roomId, this.config?.displayName);

    const room: Room = {
      id: roomId as RoomId,
      name: options?.name as string || `Room ${roomId.substring(0, 8)}`,
      participants: [this.localPeer!],
      createdAt: new Date(),
      createdBy: this.localPeer!.id,
      isEncrypted: true,
      type: 'video',
      protocolType: CommunicationProtocol.HYPERSWARM,
      maxParticipants: 1000
    };

    this.rooms.set(roomId as RoomId, room);
    this.currentRoomId = roomId as RoomId;
    this.messages.set(roomId as RoomId, []);
    this.files.set(roomId as RoomId, []);

    this.triggerEvent('onRoomCreated', room);
    
    console.log('[ServerlessMesh] Room created:', roomId);
    return room;
  }

  /**
   * Join an existing room
   */
  async joinRoom(roomId: RoomId): Promise<Room> {
    if (!this.mesh) {
      throw new Error('Adapter not initialized');
    }

    console.log('[ServerlessMesh] Joining room:', roomId);

    // Start local media first
    await this.mesh.startLocalMedia();

    // Join the room
    await this.mesh.joinRoom(roomId, this.config?.displayName);

    const room: Room = {
      id: roomId,
      name: `Room ${roomId.substring(0, 8)}`,
      participants: [this.localPeer!],
      createdAt: new Date(),
      createdBy: 'unknown' as PeerId,
      isEncrypted: true,
      type: 'video',
      protocolType: CommunicationProtocol.HYPERSWARM,
      maxParticipants: 1000
    };

    this.rooms.set(roomId, room);
    this.currentRoomId = roomId;
    this.messages.set(roomId, []);
    this.files.set(roomId, []);

    this.triggerEvent('onRoomJoined', room);
    
    console.log('[ServerlessMesh] Joined room:', roomId);
    return room;
  }

  /**
   * Leave a room
   */
  async leaveRoom(roomId: RoomId): Promise<void> {
    console.log('[ServerlessMesh] Leaving room:', roomId);

    if (this.mesh) {
      await this.mesh.leaveRoom();
      this.mesh.stopLocalMedia();
    }

    this.rooms.delete(roomId);
    this.messages.delete(roomId);
    this.files.delete(roomId);
    this.peers.clear();
    
    if (this.currentRoomId === roomId) {
      this.currentRoomId = null;
    }

    this.triggerEvent('onRoomLeft', roomId);
    console.log('[ServerlessMesh] Left room:', roomId);
  }

  /**
   * Get all rooms
   */
  getRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Send a message to a room (via data channel)
   */
  async sendMessage(
    roomId: RoomId, 
    content: string, 
    contentType: 'text' | 'image' | 'file' | 'system' = 'text',
    replyToId?: MessageId
  ): Promise<Message> {
    if (!this.localPeer) {
      throw new Error('Adapter not initialized');
    }

    const message: Message = {
      id: crypto.randomUUID() as MessageId,
      roomId,
      senderId: this.localPeer.id,
      content,
      contentType,
      timestamp: new Date(),
      isEncrypted: true,
      replyToId,
      readBy: [this.localPeer.id]
    };

    // Store locally
    const roomMessages = this.messages.get(roomId) || [];
    roomMessages.push(message);
    this.messages.set(roomId, roomMessages);

    // TODO: Send via data channel to all peers

    return message;
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: MessageId): Promise<void> {
    // Find and remove the message
    for (const [roomId, messages] of this.messages) {
      const index = messages.findIndex(m => m.id === messageId);
      if (index !== -1) {
        messages.splice(index, 1);
        break;
      }
    }
  }

  /**
   * Send a file
   */
  async sendFile(roomId: RoomId, file: File): Promise<FileId> {
    if (!this.localPeer) {
      throw new Error('Adapter not initialized');
    }

    const fileId = crypto.randomUUID() as FileId;
    
    const metadata: FileMetadata = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      chunks: Math.ceil(file.size / (64 * 1024)), // 64KB chunks
      ownerId: this.localPeer.id
    };

    const roomFiles = this.files.get(roomId) || [];
    roomFiles.push(metadata);
    this.files.set(roomId, roomFiles);

    // TODO: Implement file chunking and transfer via data channel

    return fileId;
  }

  /**
   * Cancel a file transfer
   */
  async cancelFileTransfer(fileId: FileId): Promise<void> {
    // TODO: Implement
    console.log('[ServerlessMesh] Cancel file transfer:', fileId);
  }

  /**
   * Get available files in a room
   */
  getAvailableFiles(roomId: RoomId): FileMetadata[] {
    return this.files.get(roomId) || [];
  }

  /**
   * Download a file
   */
  async downloadFile(fileId: FileId): Promise<Blob> {
    // TODO: Implement
    throw new Error('File download not yet implemented');
  }

  /**
   * Start local media stream
   */
  async startLocalStream(audioDeviceId?: string, videoDeviceId?: string): Promise<MediaStream> {
    if (!this.mesh) {
      throw new Error('Adapter not initialized');
    }

    const constraints: MediaStreamConstraints = {
      audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
      video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true
    };

    return await this.mesh.startLocalMedia(constraints);
  }

  /**
   * Stop local media stream
   */
  stopLocalStream(): void {
    this.mesh?.stopLocalMedia();
  }

  /**
   * Get local media stream
   */
  getLocalStream(): MediaStream | null {
    return this.mesh?.getLocalStream() || null;
  }

  /**
   * Register an event handler
   */
  on<K extends keyof ProtocolEvents>(event: K, callback: ProtocolEvents[K]): void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = new Set();
    }
    this.eventHandlers[event]!.add(callback);
  }

  /**
   * Remove an event handler
   */
  off<K extends keyof ProtocolEvents>(event: K, callback: ProtocolEvents[K]): void {
    this.eventHandlers[event]?.delete(callback);
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners<K extends keyof ProtocolEvents>(event?: K): void {
    if (event) {
      delete this.eventHandlers[event];
    } else {
      this.eventHandlers = {};
    }
  }

  /**
   * Trigger an event
   */
  private triggerEvent<K extends keyof ProtocolEvents>(
    event: K, 
    ...args: Parameters<ProtocolEvents[K]>
  ): void {
    const handlers = this.eventHandlers[event];
    if (handlers) {
      handlers.forEach(handler => {
        try {
          (handler as Function)(...args);
        } catch (error) {
          console.error(`[ServerlessMesh] Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get the mesh instance for advanced usage
   */
  getMesh(): ServerlessVideoMesh | null {
    return this.mesh;
  }

  /**
   * Get active speakers
   */
  getActiveSpeakers(): string[] {
    return this.mesh?.getActiveSpeakers() || [];
  }

  /**
   * Get peer count
   */
  getPeerCount(): number {
    return this.mesh?.getPeerCount() || 0;
  }
}

export default ServerlessMeshAdapter;
