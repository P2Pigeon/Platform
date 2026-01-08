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
 * Nostr Protocol Adapter Implementation
 * 
 * This adapter implements the ProtocolAdapter interface using Nostr
 * for decentralized, censorship-resistant communication with
 * end-to-end encryption and cryptographic identity.
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
  WebRTCConfig,
  NostrConfig,
  HypernatConfig
} from '../../types/core';
import { ProtocolAdapter, ProtocolEvents } from './ProtocolAdapter';
import { NostrClient } from '../nostr/NostrClient';
import type { Event as NostrEvent } from 'nostr-tools';

function generateUUID(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  array[6] = (array[6] & 0x0f) | 0x40;
  array[8] = (array[8] & 0x3f) | 0x80;
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
}

export class NostrAdapter implements ProtocolAdapter {
  readonly protocolType = CommunicationProtocol.NOSTR;
  
  private client: NostrClient;
  private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private config: NostrConfig = {};
  private localPeer: Peer;
  private remotePeers: Map<PeerId, Peer> = new Map();
  private rooms: Map<RoomId, Room> = new Map();
  private messages: Map<RoomId, Message[]> = new Map();
  private channelSubscriptions: Map<RoomId, string> = new Map();
  private eventHandlers: Partial<Record<keyof ProtocolEvents, Set<Function>>> = {};
  
  constructor(config?: NostrConfig) {
    this.client = new NostrClient({
      privateKey: config?.privateKey,
      relays: config?.relays
    });
    
    this.localPeer = {
      id: '' as PeerId,
      connectionStatus: ConnectionStatus.DISCONNECTED,
      protocolType: CommunicationProtocol.NOSTR,
      isLocal: true,
      capabilities: {
        supportsEncryption: true,
        supportedEncryptionAlgorithms: ['NIP-04'],
        supportsFileTransfer: true,
        supportsVideo: false,
        supportsAudio: false
      }
    };
    
    if (config) {
      this.config = config;
    }
  }
  
  async initialize(config: WebRTCConfig | NostrConfig | HypernatConfig): Promise<void> {
    const nostrConfig = config as NostrConfig;
    this.config = nostrConfig;
    
    if (nostrConfig.privateKey) {
      this.client.setPrivateKey(nostrConfig.privateKey);
    } else {
      // Generate new keypair if none provided
      this.client.generateKeyPair();
    }
    
    const publicKey = this.client.getPublicKey();
    if (publicKey) {
      this.localPeer.id = publicKey as PeerId;
      this.localPeer.publicKey = publicKey;
    }
    
    this.connectionStatus = ConnectionStatus.CONNECTING;
    
    try {
      await this.client.connect();
      this.connectionStatus = ConnectionStatus.CONNECTED;
      this.localPeer.connectionStatus = ConnectionStatus.CONNECTED;
      
      // Subscribe to direct messages
      this.client.subscribeToDirectMessages((event, decrypted) => {
        this.handleDirectMessage(event, decrypted);
      });
      
      console.log('NostrAdapter initialized with pubkey:', publicKey);
    } catch (error) {
      this.connectionStatus = ConnectionStatus.ERROR;
      throw error;
    }
  }

  async connect(): Promise<void> {
    if (this.connectionStatus === ConnectionStatus.CONNECTED) return;
    await this.initialize(this.config);
  }

  async disconnect(): Promise<void> {
    // Unsubscribe from all channels
    for (const [roomId, subId] of this.channelSubscriptions) {
      this.client.unsubscribe(subId);
    }
    this.channelSubscriptions.clear();
    
    this.client.disconnect();
    this.connectionStatus = ConnectionStatus.DISCONNECTED;
    this.localPeer.connectionStatus = ConnectionStatus.DISCONNECTED;
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
    const name = (options?.name as string) || `Room ${Date.now()}`;
    const about = options?.about as string;
    
    // Create a Nostr channel (NIP-28)
    const channelEvent = await this.client.createChannel(name, about);
    const roomId = channelEvent.id as RoomId;
    
    const room: Room = {
      id: roomId,
      name,
      createdAt: new Date(),
      createdBy: this.localPeer.id,
      participants: [this.localPeer],
      type: 'data',
      isEncrypted: options?.isEncrypted !== false,
      protocolType: CommunicationProtocol.NOSTR
    };
    
    this.rooms.set(roomId, room);
    this.messages.set(roomId, []);
    
    // Subscribe to channel messages
    const subId = this.client.subscribeToChannel(roomId, (event) => {
      this.handleChannelMessage(roomId, event);
    });
    this.channelSubscriptions.set(roomId, subId);
    
    this.triggerEvent('onRoomCreated', room);
    this.triggerEvent('onRoomJoined', room);
    
    return room;
  }

  async joinRoom(roomId: RoomId): Promise<Room> {
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId)!;
    }
    
    // For Nostr, joining a room means subscribing to channel messages
    const room: Room = {
      id: roomId,
      name: `Channel ${roomId.substring(0, 8)}`,
      createdAt: new Date(),
      createdBy: '' as PeerId,
      participants: [this.localPeer],
      type: 'data',
      isEncrypted: false,
      protocolType: CommunicationProtocol.NOSTR
    };
    
    this.rooms.set(roomId, room);
    this.messages.set(roomId, []);
    
    // Subscribe to channel messages
    const subId = this.client.subscribeToChannel(roomId, (event) => {
      this.handleChannelMessage(roomId, event);
    });
    this.channelSubscriptions.set(roomId, subId);
    
    this.triggerEvent('onRoomJoined', room);
    
    return room;
  }

  async leaveRoom(roomId: RoomId): Promise<void> {
    const subId = this.channelSubscriptions.get(roomId);
    if (subId) {
      this.client.unsubscribe(subId);
      this.channelSubscriptions.delete(roomId);
    }
    
    this.rooms.delete(roomId);
    this.messages.delete(roomId);
    
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
      throw new Error(`Room ${roomId} not found`);
    }
    
    // Send message to Nostr channel
    const event = await this.client.sendChannelMessage(roomId, content, replyToId);
    
    const message: Message = {
      id: event.id as MessageId,
      senderId: this.localPeer.id,
      roomId,
      content,
      timestamp: new Date(event.created_at * 1000),
      isEncrypted: false,
      readBy: [this.localPeer.id],
      contentType,
      replyToId
    };
    
    // Store locally
    const roomMessages = this.messages.get(roomId) || [];
    roomMessages.push(message);
    this.messages.set(roomId, roomMessages);
    
    return message;
  }

  async deleteMessage(messageId: MessageId): Promise<void> {
    // Nostr doesn't support true deletion, but we can send a delete event (NIP-09)
    console.log('Delete requested for message:', messageId);
  }

  async sendFile(roomId: RoomId, file: File): Promise<FileId> {
    // For Nostr file sharing, we'd typically upload to a media server
    // and share the URL. This is a simplified implementation.
    const fileId = generateUUID() as FileId;
    
    // In a real implementation, upload file and get URL
    const fileUrl = `nostr:file:${fileId}`;
    
    // Send file announcement message
    await this.sendMessage(roomId, JSON.stringify({
      type: 'file',
      fileId,
      name: file.name,
      size: file.size,
      mimeType: file.type,
      url: fileUrl
    }), 'file');
    
    return fileId;
  }

  async cancelFileTransfer(fileId: FileId): Promise<void> {
    // Not applicable for Nostr file sharing
  }

  getAvailableFiles(roomId: RoomId): FileMetadata[] {
    const roomMessages = this.messages.get(roomId) || [];
    const fileMessages = roomMessages.filter(m => m.contentType === 'file');
    
    return fileMessages.map(m => {
      try {
        const fileData = JSON.parse(m.content);
        return {
          id: fileData.fileId as FileId,
          name: fileData.name,
          size: fileData.size,
          type: fileData.mimeType,
          lastModified: m.timestamp.getTime(),
          chunks: 1,
          ownerId: m.senderId
        };
      } catch {
        return null;
      }
    }).filter(Boolean) as FileMetadata[];
  }

  async downloadFile(fileId: FileId): Promise<Blob> {
    throw new Error('File download not implemented for Nostr');
  }

  async startLocalStream(): Promise<MediaStream> {
    throw new Error('Media streaming not supported in Nostr protocol');
  }

  stopLocalStream(): void {
    // Not applicable for Nostr
  }

  getLocalStream(): MediaStream | null {
    return null;
  }

  on<K extends keyof ProtocolEvents>(event: K, callback: ProtocolEvents[K]): void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = new Set();
    }
    this.eventHandlers[event]!.add(callback);
  }

  off<K extends keyof ProtocolEvents>(event: K, callback: ProtocolEvents[K]): void {
    this.eventHandlers[event]?.delete(callback);
  }

  removeAllListeners<K extends keyof ProtocolEvents>(event?: K): void {
    if (event) {
      this.eventHandlers[event]?.clear();
    } else {
      Object.keys(this.eventHandlers).forEach(key => {
        this.eventHandlers[key as keyof ProtocolEvents]?.clear();
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

  private handleDirectMessage(event: NostrEvent, decrypted: string): void {
    // Handle incoming DM
    const senderId = event.pubkey as PeerId;
    
    // Create a virtual room for this DM conversation
    const dmRoomId = `dm:${[this.localPeer.id, senderId].sort().join(':')}` as RoomId;
    
    if (!this.rooms.has(dmRoomId)) {
      const dmRoom: Room = {
        id: dmRoomId,
        name: `DM with ${senderId.substring(0, 8)}`,
        createdAt: new Date(),
        createdBy: senderId,
        participants: [this.localPeer],
        type: 'data',
        isEncrypted: true,
        protocolType: CommunicationProtocol.NOSTR
      };
      this.rooms.set(dmRoomId, dmRoom);
      this.messages.set(dmRoomId, []);
    }
    
    const message: Message = {
      id: event.id as MessageId,
      senderId,
      roomId: dmRoomId,
      content: decrypted,
      timestamp: new Date(event.created_at * 1000),
      isEncrypted: true,
      isDecrypted: true,
      readBy: [this.localPeer.id],
      contentType: 'text'
    };
    
    const roomMessages = this.messages.get(dmRoomId) || [];
    roomMessages.push(message);
    this.messages.set(dmRoomId, roomMessages);
    
    this.triggerEvent('onMessageReceived', message);
  }

  private handleChannelMessage(roomId: RoomId, event: NostrEvent): void {
    const senderId = event.pubkey as PeerId;
    
    // Track peer
    if (!this.remotePeers.has(senderId)) {
      const peer: Peer = {
        id: senderId,
        publicKey: senderId,
        connectionStatus: ConnectionStatus.CONNECTED,
        protocolType: CommunicationProtocol.NOSTR,
        isLocal: senderId === this.localPeer.id
      };
      this.remotePeers.set(senderId, peer);
      this.triggerEvent('onPeerConnect', peer);
    }
    
    // Don't process our own messages
    if (senderId === this.localPeer.id) return;
    
    const message: Message = {
      id: event.id as MessageId,
      senderId,
      roomId,
      content: event.content,
      timestamp: new Date(event.created_at * 1000),
      isEncrypted: false,
      readBy: [this.localPeer.id],
      contentType: 'text'
    };
    
    const roomMessages = this.messages.get(roomId) || [];
    roomMessages.push(message);
    this.messages.set(roomId, roomMessages);
    
    this.triggerEvent('onMessageReceived', message);
  }

  /**
   * Send a direct encrypted message to a peer (NIP-04)
   */
  async sendDirectMessage(recipientPubkey: string, content: string): Promise<Message> {
    const event = await this.client.sendDirectMessage(recipientPubkey, content);
    
    const dmRoomId = `dm:${[this.localPeer.id, recipientPubkey].sort().join(':')}` as RoomId;
    
    const message: Message = {
      id: event.id as MessageId,
      senderId: this.localPeer.id,
      roomId: dmRoomId,
      content,
      timestamp: new Date(event.created_at * 1000),
      isEncrypted: true,
      readBy: [this.localPeer.id],
      contentType: 'text'
    };
    
    return message;
  }
}
