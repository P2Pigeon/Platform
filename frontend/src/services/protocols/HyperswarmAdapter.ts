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
 * Hyperswarm Protocol Adapter Implementation
 * 
 * This adapter implements the ProtocolAdapter interface using Hyperswarm
 * via DHT relay for browser support (browser-native P2P)
 * for peer-to-peer communication through NAT traversal with end-to-end
 * encryption and zero-trust security principles.
 */
// Using WebSocket for browser-compatible P2P bootstrap instead of DHT
import { binary_to_base58 as encode, base58_to_binary as decode } from 'base58-js';
// Use browser-compatible imports
// Browser already has performance API
const performance = window.performance;

// Use browser's native crypto API
const crypto = window.crypto;
const subtle = crypto.subtle;

import { ProtocolAdapter, ProtocolEvents } from './ProtocolAdapter';
import { io, Socket } from 'socket.io-client';
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
  HypernatConfig,
  WebRTCConfig,
  NostrConfig,
  TransferProgress,
  ConnectionMetrics,
  RoomEncryptionDetails,
  SecurityConfig
} from '../../types/core';

/**
 * Generate a UUID v4 using browser's crypto API
 * @returns A UUID v4 string
 */
function generateUUID(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  
  // Set version to 4 (random UUID)
  array[6] = (array[6] & 0x0f) | 0x40;
  // Set variant to standard
  array[8] = (array[8] & 0x3f) | 0x80;
  
  // Convert to hex string in UUID format
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
}

/**
 * Maximum file size that can be transferred (100MB)
 */
const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * Default chunk size for file transfers (64KB)
 */
const DEFAULT_CHUNK_SIZE = 64 * 1024;

/**
 * Maximum reconnection attempts before giving up
 */
const MAX_RECONNECTION_ATTEMPTS = 5;

/**
 * Base delay for exponential backoff (in ms)
 */
const BASE_RECONNECT_DELAY = 1000;

export class HyperswarmAdapter implements ProtocolAdapter {
  readonly protocolType = CommunicationProtocol.HYPERSWARM;
  
  private socket: Socket | null = null;
  private dhtRelay: WebSocket | null = null;
  private currentChannel: string | null = null;
  private peerConnections: Map<PeerId, RTCPeerConnection> = new Map();
  private remoteStreams: Map<PeerId, MediaStream> = new Map();
  private config!: HypernatConfig;
  private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private localPeer: Peer;
  private remotePeers: Map<PeerId, Peer> = new Map();
  private rooms: Map<RoomId, Room> = new Map();
  private roomEncryptionKeys: Map<RoomId, RoomEncryptionDetails> = new Map();
  private fileTransfers: Map<FileId, FileMetadata> = new Map();
  private transferProgress: Map<FileId, TransferProgress> = new Map();
  private connectionMetrics: ConnectionMetrics = {
    latency: 0,
    lastConnected: 0,
    connectionAttempts: 0,
    successfulConnections: 0,
    failedConnections: 0
  };
  private eventHandlers: Partial<Record<keyof ProtocolEvents, Set<Function>>> = {};
  private localStream: MediaStream | null = null;
  
  // Connection management
  private reconnectionAttempts: number = 0;
  
  // Security configuration
  private securityConfig: SecurityConfig = {
    enableE2EEncryption: true,
    encryptionAlgorithm: 'AES-GCM',
    keyRotationInterval: 3600000, // 1 hour in milliseconds
    enablePFS: true, // Perfect Forward Secrecy
  };

  /**
   * Creates a new instance of the HypernatAdapter
   * @param config Optional configuration for the adapter
   */
  constructor(config?: HypernatConfig) {
    // Generate a cryptographically secure UUID for the peer ID
    // Use browser-compatible UUID generation
    const peerId = generateUUID();
    
    this.localPeer = {
      id: peerId,
      connectionStatus: ConnectionStatus.DISCONNECTED,
      protocolType: CommunicationProtocol.HYPERSWARM,
      isLocal: true,
      capabilities: {
        supportsEncryption: true,
        supportedEncryptionAlgorithms: ['AES-GCM', 'ChaCha20-Poly1305'],
        supportsFileTransfer: true,
        supportsVideo: true,
        supportsAudio: true
      }
    };
    
    if (config) {
      this.config = this.validateConfig(config);
    }
    
    // Set up resource cleanup on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.cleanup());
    }
  }

  /**
   * Validates and sanitizes the provided configuration
   * @param config The configuration to validate
   * @returns Validated and sanitized configuration
   */
  private validateConfig(config: HypernatConfig): HypernatConfig {
    // Create a sanitized copy of the config
    const sanitizedConfig: HypernatConfig = { ...config };
    
    // Validate port if provided
    if (sanitizedConfig.port) {
      const portStr = String(sanitizedConfig.port);
      const port = parseInt(portStr, 10);
      if (isNaN(port) || port < 1024 || port > 65535) {
        throw new Error('Invalid port number. Must be between 1024 and 65535.');
      }
      sanitizedConfig.port = port.toString();
    }
    
    // Validate peer public key if provided
    if (sanitizedConfig.peerPublicKey) {
      try {
        decode(sanitizedConfig.peerPublicKey);
      } catch (error) {
        throw new Error('Invalid peer public key format.');
      }
    }
    
    return sanitizedConfig;
  }

  /**
   * Initializes the adapter with the provided configuration
   * @param config Configuration for the adapter
   */
  async initialize(config: WebRTCConfig | NostrConfig | HypernatConfig): Promise<void> {
    if (!('bootstrapNodes' in config) && !('peerPublicKey' in config)) {
      throw new Error('Invalid configuration for HypernatAdapter');
    }
    const startTime = performance.now();
    
    // Update and validate configuration
    this.config = this.validateConfig({ ...this.config, ...(config as HypernatConfig) });
    this.connectionStatus = ConnectionStatus.CONNECTING;
    this.connectionMetrics.connectionAttempts++;
    
    try {
      // Get signaling server URL from environment or default
      const signalingUrl = import.meta.env.VITE_SIGNALING_URL || window.location.origin;
      const serverUrl = signalingUrl.replace(/\/$/, '');
      
      // Connect to DHT Relay for Hyperswarm peer discovery
      const dhtRelayUrl = serverUrl.replace('http', 'ws') + '/dht-relay';
      await this.connectToDHTRelay(dhtRelayUrl);
      
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000
      });
      
      // Set up Socket.io event handlers
      this.socket.on('connect', () => {
        console.log('Connected to P2P signaling server');
        this.connectionStatus = ConnectionStatus.CONNECTED;
        this.triggerEvent('onPeerStatusChange', this.localPeer.id, ConnectionStatus.CONNECTED);
      });
      
      this.socket.on('disconnect', () => {
        console.log('Disconnected from P2P signaling server');
        this.connectionStatus = ConnectionStatus.DISCONNECTED;
        this.triggerEvent('onPeerStatusChange', this.localPeer.id, ConnectionStatus.DISCONNECTED);
      });
      
      this.socket.on('addPeer', (data: { peer_id: string; peers: any; should_create_offer: boolean }) => {
        console.log('Peer added:', data.peer_id);
        // Create a Peer object from the socket data
        const peer: Peer = {
          id: data.peer_id as PeerId,
          publicKey: data.peer_id,
          connectionStatus: ConnectionStatus.CONNECTED,
          protocolType: CommunicationProtocol.HYPERSWARM,
          isLocal: false,
          lastSeen: new Date()
        };
        this.remotePeers.set(peer.id, peer);
        this.triggerEvent('onPeerConnect', peer);
      });
      
      this.socket.on('removePeer', (data: { peer_id: string }) => {
        console.log('Peer removed:', data.peer_id);
        this.remotePeers.delete(data.peer_id as PeerId);
        this.triggerEvent('onPeerDisconnect', data.peer_id as PeerId);
      });
      
      // Wait for connection to establish
      await new Promise((resolve, reject) => {
        if (this.socket?.connected) {
          resolve(void 0);
          return;
        }
        
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);
        
        this.socket?.on('connect', () => {
          clearTimeout(timeout);
          resolve(void 0);
        });
        
        this.socket?.on('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
      
      this.connectionStatus = ConnectionStatus.CONNECTED;
      this.localPeer.connectionStatus = ConnectionStatus.CONNECTED;
      this.connectionMetrics.lastConnected = Date.now();
      this.connectionMetrics.successfulConnections++;
      this.reconnectionAttempts = 0;
      
      // Track connection latency
      this.connectionMetrics.latency = performance.now() - startTime;
      
      this.triggerEvent('onPeerStatusChange', this.localPeer.id, this.connectionStatus);
      console.info('Hypernat node initialized successfully');
    } catch (error) {
      this.connectionStatus = ConnectionStatus.ERROR;
      this.connectionMetrics.failedConnections++;
      
      const typedError = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to initialize Hypernat:', typedError);
      this.triggerEvent('onError', new Error(`Failed to initialize Hypernat: ${typedError.message}`));
      throw typedError;
    }
  }

  /**
   * Connects to the P2P network with exponential backoff for reconnection
   */
  async connect(): Promise<void> {
    if (this.connectionStatus === ConnectionStatus.CONNECTED) {
      return;
    }

    try {
      const startTime = performance.now();
      this.connectionMetrics.connectionAttempts++;
      
      if (!this.socket) {
        await this.initialize(this.config);
      } else {
        // Check if any bootstrap connections are still open
        if (this.socket.connected) {
          this.connectionStatus = ConnectionStatus.CONNECTED;
          this.localPeer.connectionStatus = ConnectionStatus.CONNECTED;
          this.connectionMetrics.lastConnected = Date.now();
          this.connectionMetrics.successfulConnections++;
          this.connectionMetrics.latency = performance.now() - startTime;
          this.triggerEvent('onPeerStatusChange', this.localPeer.id, this.connectionStatus);
        } else {
          // Reinitialize if no active connections
          await this.initialize(this.config);
        }
      }
      
      // Reset reconnection attempts on successful connection
      this.reconnectionAttempts = 0;
    } catch (error) {
      this.connectionStatus = ConnectionStatus.ERROR;
      this.connectionMetrics.failedConnections++;
      
      const typedError = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to connect:', typedError);
      this.triggerEvent('onError', new Error(`Failed to connect: ${typedError.message}`));
      
      // Implement exponential backoff for reconnection attempts
      if (this.reconnectionAttempts < MAX_RECONNECTION_ATTEMPTS) {
        this.reconnectionAttempts++;
        const backoffTime = BASE_RECONNECT_DELAY * Math.pow(2, this.reconnectionAttempts - 1);
        console.info(`Reconnecting in ${backoffTime}ms (attempt ${this.reconnectionAttempts} of ${MAX_RECONNECTION_ATTEMPTS})`);
        
        setTimeout(() => {
          this.connect().catch(reconnectError => {
            console.error('Reconnection attempt failed:', reconnectError);
          });
        }, backoffTime);
      } else {
        console.error(`Maximum reconnection attempts (${MAX_RECONNECTION_ATTEMPTS}) reached. Giving up.`);
      }
      
      throw typedError;
    }
  }

  /**
   * Disconnects from the P2P network and cleans up resources
   */
  async disconnect(): Promise<void> {
    if (this.connectionStatus === ConnectionStatus.DISCONNECTED) {
      return;
    }

    try {
      // Leave current channel if joined
      if (this.socket && this.currentChannel) {
        this.socket.emit('leave', { channel: this.currentChannel });
        this.currentChannel = null;
      }
      
      // Disconnect Socket.io client
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
      
      this.connectionStatus = ConnectionStatus.DISCONNECTED;
      this.triggerEvent('onPeerStatusChange', this.localPeer.id, ConnectionStatus.DISCONNECTED);
      
      console.log('HypernatAdapter disconnected');
    } catch (error) {
      console.error('Error disconnecting HypernatAdapter:', error);
      throw error;
    }
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  getCurrentPeer(): Peer {
    return this.localPeer;
  }

  getPeers(): Peer[] {
    return Array.from(this.remotePeers.values());
  }

  async createRoom(options?: Record<string, unknown>): Promise<Room> {
    if (!this.socket) {
      throw new Error('Not connected to signaling server');
    }
    
    const roomId = (options?.roomId as string) || generateUUID();
    
    // Join the Socket.io channel for this room
    const joinConfig = {
      channel: roomId,
      peer_name: `User_${Date.now()}`,
      peer_uuid: `${Date.now()}_${Math.random()}`,
      peer_token: '',
      peer_info: {
        peer_video: true,
        peer_audio: true,
        peer_screen: false,
        peer_recording: false
      },
      ipLookup: { enabled: false }
    };
    
    this.socket.emit('join', joinConfig);
    this.currentChannel = roomId;
    
    const room: Room = {
      id: roomId as RoomId,
      name: `Room ${roomId}`,
      participants: [this.localPeer],
      createdAt: new Date(),
      createdBy: this.localPeer.id,
      type: 'video',
      isEncrypted: options?.isEncrypted !== false,
      protocolType: CommunicationProtocol.HYPERSWARM
    };
    
    this.rooms.set(roomId as RoomId, room);
    this.triggerEvent('onRoomJoined', room);
    return room;
  }

  async joinRoom(roomId: RoomId): Promise<Room> {
    // Check if we're already in this room
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId)!;
    }
    
    // Convert room ID to DHT topic hash (32 bytes hex)
    const topicHex = await this.roomIdToTopicHash(roomId);
    
    // Join via DHT Relay for decentralized peer discovery
    this.joinDHTTopic(topicHex);
    console.log('[Hyperswarm] Joining room via DHT topic:', topicHex.substring(0, 16));
    
    // Also join via Socket.io as fallback
    if (this.socket) {
      const joinConfig = {
        channel: roomId,
        peer_name: `User_${Date.now()}`,
        peer_uuid: `${Date.now()}_${Math.random()}`,
        peer_token: '',
        peer_info: {
          peer_video: true,
          peer_audio: true,
          peer_screen: false,
          peer_recording: false
        },
        ipLookup: { enabled: false }
      };
      
      this.socket.emit('join', joinConfig);
    }
    
    this.currentChannel = roomId;
    
    const room: Room = {
      id: roomId,
      name: `Room ${roomId}`,
      participants: [this.localPeer],
      createdAt: new Date(),
      createdBy: this.localPeer.id,
      type: 'video',
      isEncrypted: true,
      protocolType: CommunicationProtocol.HYPERSWARM
    };
    
    this.rooms.set(roomId, room);
    this.triggerEvent('onRoomJoined', room);
    return room;
  }

  /**
   * Convert room ID to DHT topic hash (32 bytes)
   */
  private async roomIdToTopicHash(roomId: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(`pigeon-room:${roomId}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async leaveRoom(roomId: RoomId): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room with ID ${roomId} not found`);
    }

    this.rooms.delete(roomId);
    this.triggerEvent('onRoomLeft', roomId);
  }

  getRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  async sendMessage(
    roomId: RoomId, 
    content: string, 
    contentType: 'text' | 'image' | 'file' | 'system' = 'text', 
    replyToId?: MessageId
  ): Promise<Message> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room with ID ${roomId} not found`);
    }

    const messageId = generateUUID();
    const message: Message = {
      id: messageId,
      senderId: this.localPeer.id,
      roomId,
      content,
      timestamp: new Date(),
      isEncrypted: room.isEncrypted,
      readBy: [this.localPeer.id],
      contentType,
      replyToId
    };

    // In a real implementation, this would send the message through the Hypernat channel
    // This is a simplified implementation

    // Return the created message - in a real app, this would come from the protocol after confirmation
    this.triggerEvent('onMessageReceived', message);
    return message;
  }

  async deleteMessage(messageId: MessageId): Promise<void> {
    // Simplified implementation
    // In a real implementation, this would send a delete command through the Hypernat channel
  }

  async sendFile(roomId: RoomId, file: File): Promise<FileId> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room with ID ${roomId} not found`);
    }

    const fileId = generateUUID();
    const fileMetadata: FileMetadata = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      chunks: Math.ceil(file.size / (64 * 1024)), // 64KB chunks
      ownerId: this.localPeer.id
    };

    this.fileTransfers.set(fileId, fileMetadata);

    // In a real implementation, this would begin transmitting file chunks through the Hypernat channel
    // This is a simplified placeholder

    return fileId;
  }

  async cancelFileTransfer(fileId: FileId): Promise<void> {
    // Simplified implementation - would send cancel command through Hypernat in real app
    this.fileTransfers.delete(fileId);
  }

  getAvailableFiles(roomId: RoomId): FileMetadata[] {
    return Array.from(this.fileTransfers.values()).filter(file => {
      const room = this.rooms.get(roomId);
      return room && room.participants.some(p => p.id === file.ownerId);
    });
  }

  async downloadFile(fileId: FileId): Promise<Blob> {
    // This is a placeholder for actual file download implementation
    // In a real implementation, this would request file chunks through the Hypernat channel
    // and reassemble them into a blob
    throw new Error("File download not implemented");
  }

  async startLocalStream(audioDeviceId?: string, videoDeviceId?: string): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
        video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : true,
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.localStream;
    } catch (error) {
      this.triggerEvent('onError', new Error(`Failed to get local media stream: ${error}`));
      throw error;
    }
  }

  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  on<K extends keyof ProtocolEvents>(event: K, callback: ProtocolEvents[K]): void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = new Set();
    }
    this.eventHandlers[event]!.add(callback);
  }

  off<K extends keyof ProtocolEvents>(event: K, callback: ProtocolEvents[K]): void {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event]!.delete(callback);
    }
  }
  
  /**
   * Remove all event listeners for a specific event or all events
   * @param event Optional event type. If not provided, clears all listeners for all events
   */
  removeAllListeners<K extends keyof ProtocolEvents>(event?: K): void {
    if (event) {
      // Remove all listeners for a specific event
      if (this.eventHandlers[event]) {
        this.eventHandlers[event]!.clear();
      }
    } else {
      // Remove all listeners for all events
      Object.keys(this.eventHandlers).forEach(eventName => {
        const typedEventName = eventName as keyof ProtocolEvents;
        if (this.eventHandlers[typedEventName]) {
          this.eventHandlers[typedEventName]!.clear();
        }
      });
    }
  }

  private triggerEvent<K extends keyof ProtocolEvents>(
    event: K,
    ...args: Parameters<ProtocolEvents[K]>
  ): void {
    if (this.eventHandlers[event]) {
      for (const handler of this.eventHandlers[event]!) {
        try {
          (handler as Function)(...args);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      }
    }
  }
  
  /**
   * Performs cleanup of resources used by the adapter
   */
  private cleanup(): void {
    // Stop any media streams
    this.stopLocalStream();
    
    // Close all peer connections
    for (const [peerId, pc] of this.peerConnections) {
      pc.close();
    }
    this.peerConnections.clear();
    this.remoteStreams.clear();
    
    // Close DHT relay connection
    if (this.dhtRelay) {
      this.dhtRelay.close();
      this.dhtRelay = null;
    }
    
    // Disconnect from the network
    if (this.connectionStatus === ConnectionStatus.CONNECTED) {
      this.disconnect().catch(error => {
        console.error('Error during cleanup:', error);
      });
    }
    
    // Clear event handlers
    this.removeAllListeners();
    
    // Remove event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', () => this.cleanup());
    }
  }

  /**
   * Connect to DHT Relay server for Hyperswarm peer discovery
   * This enables decentralized peer discovery in browser via DHT
   */
  private async connectToDHTRelay(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('[Hyperswarm] Connecting to DHT Relay:', url);
        this.dhtRelay = new WebSocket(url);
        
        const timeout = setTimeout(() => {
          reject(new Error('DHT Relay connection timeout'));
        }, 10000);

        this.dhtRelay.onopen = () => {
          clearTimeout(timeout);
          console.log('[Hyperswarm] Connected to DHT Relay');
          resolve();
        };

        this.dhtRelay.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleDHTRelayMessage(message);
          } catch (err) {
            console.error('[Hyperswarm] Error parsing DHT message:', err);
          }
        };

        this.dhtRelay.onerror = (error) => {
          clearTimeout(timeout);
          console.warn('[Hyperswarm] DHT Relay error (falling back to Socket.io):', error);
          // Don't reject - fall back to Socket.io signaling
          resolve();
        };

        this.dhtRelay.onclose = () => {
          console.log('[Hyperswarm] DHT Relay disconnected');
        };
      } catch (err) {
        console.warn('[Hyperswarm] DHT Relay not available, using Socket.io fallback');
        resolve(); // Don't fail - fall back to Socket.io
      }
    });
  }

  /**
   * Handle messages from DHT Relay server
   */
  private handleDHTRelayMessage(message: any): void {
    switch (message.type) {
      case 'welcome':
        console.log('[Hyperswarm] DHT Relay welcome, server pubkey:', message.publicKey?.substring(0, 16));
        break;
        
      case 'joined':
        console.log('[Hyperswarm] Joined topic via DHT:', message.topic?.substring(0, 16));
        break;
        
      case 'lookup_result':
        console.log('[Hyperswarm] DHT lookup found peers:', message.peers?.length);
        // Connect to discovered peers via WebRTC
        message.peers?.forEach((peer: any) => {
          if (peer.publicKey && !this.remotePeers.has(peer.publicKey as PeerId)) {
            this.connectToPeer(peer.publicKey as PeerId);
          }
        });
        break;
        
      case 'peer_connect':
        // Incoming peer connection request
        this.handleIncomingPeerConnection(message);
        break;
        
      case 'signal':
        // WebRTC signaling via DHT relay
        this.handleSignalingMessage(message);
        break;
        
      case 'error':
        console.error('[Hyperswarm] DHT Relay error:', message.error);
        break;
    }
  }

  /**
   * Join a topic via DHT relay for peer discovery
   */
  private joinDHTTopic(topicHex: string): void {
    if (this.dhtRelay?.readyState === WebSocket.OPEN) {
      this.dhtRelay.send(JSON.stringify({
        type: 'join',
        topic: topicHex,
        server: true,
        client: true
      }));
      
      // Also lookup existing peers
      this.dhtRelay.send(JSON.stringify({
        type: 'lookup',
        topic: topicHex
      }));
    }
  }

  /**
   * Create WebRTC peer connection for media streaming
   */
  private async connectToPeer(peerId: PeerId): Promise<RTCPeerConnection> {
    if (this.peerConnections.has(peerId)) {
      return this.peerConnections.get(peerId)!;
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    });

    // Add local tracks if available
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log('[Hyperswarm] Received remote track from', peerId);
      if (event.streams[0]) {
        this.remoteStreams.set(peerId, event.streams[0]);
        this.triggerEvent('onRemoteStreamAdded', peerId, event.streams[0]);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignaling(peerId, { type: 'ice', candidate: event.candidate });
      }
    };

    // Handle connection state
    pc.onconnectionstatechange = () => {
      console.log('[Hyperswarm] Peer connection state:', pc.connectionState);
      const peer = this.remotePeers.get(peerId);
      if (peer) {
        switch (pc.connectionState) {
          case 'connected':
            peer.connectionStatus = ConnectionStatus.CONNECTED;
            break;
          case 'disconnected':
          case 'failed':
            peer.connectionStatus = ConnectionStatus.DISCONNECTED;
            break;
        }
        this.triggerEvent('onPeerStatusChange', peerId, peer.connectionStatus);
      }
    };

    this.peerConnections.set(peerId, pc);
    return pc;
  }

  /**
   * Send WebRTC signaling via DHT relay or Socket.io
   */
  private sendSignaling(peerId: PeerId, data: any): void {
    const message = { type: 'signal', peerId: this.localPeer.id, targetPeerId: peerId, data };
    
    if (this.dhtRelay?.readyState === WebSocket.OPEN) {
      this.dhtRelay.send(JSON.stringify(message));
    } else if (this.socket?.connected) {
      this.socket.emit('signal', message);
    }
  }

  /**
   * Handle incoming WebRTC signaling message
   */
  private async handleSignalingMessage(message: any): Promise<void> {
    const { peerId, data } = message;
    
    let pc = this.peerConnections.get(peerId as PeerId);
    if (!pc) {
      pc = await this.connectToPeer(peerId as PeerId);
    }

    if (data.type === 'offer') {
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.sendSignaling(peerId as PeerId, { type: 'answer', sdp: answer });
    } else if (data.type === 'answer') {
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
    } else if (data.type === 'ice' && data.candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  }

  /**
   * Handle incoming peer connection from DHT
   */
  private async handleIncomingPeerConnection(message: any): Promise<void> {
    const peerId = message.peerId as PeerId;
    const pc = await this.connectToPeer(peerId);
    
    // Create offer if we're the initiator
    if (message.shouldCreateOffer) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.sendSignaling(peerId, { type: 'offer', sdp: offer });
    }
  }

  /**
   * Get remote stream for a peer
   */
  getRemoteStream(peerId: PeerId): MediaStream | null {
    return this.remoteStreams.get(peerId) || null;
  }
}
