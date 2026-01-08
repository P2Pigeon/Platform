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
 * Hyperswarm-based Signaling for WebRTC
 * 
 * Replaces centralized signaling server with decentralized DHT-based signaling.
 * Enables fully P2P video calls without any central server for discovery.
 */

import { HyperswarmWebClient, HyperswarmConnectionState } from './HyperswarmWebClient';

/**
 * Signaling message types
 */
export enum SignalingMessageType {
  JOIN = 'join',
  LEAVE = 'leave',
  OFFER = 'offer',
  ANSWER = 'answer',
  ICE_CANDIDATE = 'ice_candidate',
  PEER_LIST = 'peer_list',
  ROOM_INFO = 'room_info',
  SFU_REDIRECT = 'sfu_redirect'
}

/**
 * Signaling message structure
 */
export interface SignalingMessage {
  type: SignalingMessageType;
  from: string;
  to?: string; // undefined = broadcast
  roomId: string;
  payload: any;
  timestamp: number;
}

/**
 * Peer info for room management
 */
export interface RoomPeer {
  peerId: string;
  publicKey: string;
  displayName?: string;
  joinedAt: Date;
  hasVideo: boolean;
  hasAudio: boolean;
  isHost: boolean;
}

/**
 * Room configuration
 */
export interface RoomConfig {
  maxPeers: number;
  sfuThreshold: number; // Switch to SFU when peers exceed this
  sfuServerUrl?: string;
  isLocked: boolean;
  requiresPassword: boolean;
}

/**
 * Events emitted by the signaling service
 */
export interface SignalingEvents {
  onPeerJoined: (peer: RoomPeer) => void;
  onPeerLeft: (peerId: string) => void;
  onOffer: (from: string, offer: RTCSessionDescriptionInit) => void;
  onAnswer: (from: string, answer: RTCSessionDescriptionInit) => void;
  onIceCandidate: (from: string, candidate: RTCIceCandidateInit) => void;
  onRoomInfo: (peers: RoomPeer[], config: RoomConfig) => void;
  onSfuRedirect: (sfuUrl: string) => void;
  onError: (error: Error) => void;
  onConnectionStateChange: (state: HyperswarmConnectionState) => void;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: RoomConfig = {
  maxPeers: 1000,
  sfuThreshold: 8, // Use SFU for groups larger than 8
  isLocked: false,
  requiresPassword: false
};

/**
 * Hyperswarm-based signaling service for WebRTC
 */
export class HyperswarmSignaling {
  private client: HyperswarmWebClient;
  private roomId: string | null = null;
  private peerId: string;
  private publicKey: string | null = null;
  private peers: Map<string, RoomPeer> = new Map();
  private config: RoomConfig = DEFAULT_CONFIG;
  private eventHandlers: Partial<SignalingEvents> = {};
  private isHost = false;

  constructor(relayUrl: string) {
    this.peerId = crypto.randomUUID();
    this.client = new HyperswarmWebClient({ relayUrl });
    this.setupClientHandlers();
  }

  /**
   * Sets up event handlers for the Hyperswarm client
   */
  private setupClientHandlers(): void {
    this.client.on('stateChange', (state: HyperswarmConnectionState) => {
      console.log('[Signaling] Connection state:', state);
      this.triggerEvent('onConnectionStateChange', state);
    });

    this.client.on('data', (data: ArrayBuffer | string, peer: any) => {
      this.handleIncomingMessage(data);
    });

    this.client.on('connection', (peer: any, topic: string) => {
      console.log('[Signaling] New peer connected:', peer.publicKey?.substring(0, 16));
    });

    this.client.on('error', (error: Error) => {
      console.error('[Signaling] Error:', error);
      this.triggerEvent('onError', error);
    });
  }

  /**
   * Connects to the DHT relay
   */
  async connect(): Promise<void> {
    console.log('[Signaling] Connecting to DHT relay...');
    await this.client.connect();
    this.publicKey = this.client.getServerPublicKey();
    console.log('[Signaling] Connected, public key:', this.publicKey?.substring(0, 16));
  }

  /**
   * Disconnects from the DHT relay
   */
  disconnect(): void {
    if (this.roomId) {
      this.leaveRoom();
    }
    this.client.disconnect();
  }

  /**
   * Creates a new room
   */
  async createRoom(roomId: string, config?: Partial<RoomConfig>): Promise<string> {
    console.log('[Signaling] Creating room:', roomId);
    
    this.roomId = roomId;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isHost = true;

    // Generate topic hash from room ID
    const topicHex = await HyperswarmWebClient.hashTopic(`p2pigeon-room-${roomId}`);
    
    // Join the swarm topic
    await this.client.join(topicHex, { server: true, client: true });

    // Add self as first peer
    const selfPeer: RoomPeer = {
      peerId: this.peerId,
      publicKey: this.publicKey || this.peerId,
      joinedAt: new Date(),
      hasVideo: true,
      hasAudio: true,
      isHost: true
    };
    this.peers.set(this.peerId, selfPeer);

    console.log('[Signaling] Room created:', roomId);
    return roomId;
  }

  /**
   * Joins an existing room
   */
  async joinRoom(roomId: string, displayName?: string): Promise<RoomPeer[]> {
    console.log('[Signaling] Joining room:', roomId);

    this.roomId = roomId;
    this.isHost = false;

    // Generate topic hash from room ID
    const topicHex = await HyperswarmWebClient.hashTopic(`p2pigeon-room-${roomId}`);

    // Join the swarm topic
    await this.client.join(topicHex, { server: true, client: true });

    // Create self peer info
    const selfPeer: RoomPeer = {
      peerId: this.peerId,
      publicKey: this.publicKey || this.peerId,
      displayName,
      joinedAt: new Date(),
      hasVideo: true,
      hasAudio: true,
      isHost: false
    };
    this.peers.set(this.peerId, selfPeer);

    // Broadcast join message
    this.broadcast({
      type: SignalingMessageType.JOIN,
      from: this.peerId,
      roomId,
      payload: { peer: selfPeer },
      timestamp: Date.now()
    });

    // Wait a bit for peer responses
    await new Promise(resolve => setTimeout(resolve, 1000));

    return Array.from(this.peers.values());
  }

  /**
   * Leaves the current room
   */
  async leaveRoom(): Promise<void> {
    if (!this.roomId) return;

    console.log('[Signaling] Leaving room:', this.roomId);

    // Broadcast leave message
    this.broadcast({
      type: SignalingMessageType.LEAVE,
      from: this.peerId,
      roomId: this.roomId,
      payload: {},
      timestamp: Date.now()
    });

    // Leave the swarm topic
    const topicHex = await HyperswarmWebClient.hashTopic(`p2pigeon-room-${this.roomId}`);
    await this.client.leave(topicHex);

    this.peers.clear();
    this.roomId = null;
  }

  /**
   * Sends a WebRTC offer to a specific peer
   */
  sendOffer(toPeerId: string, offer: RTCSessionDescriptionInit): void {
    if (!this.roomId) return;

    this.sendMessage({
      type: SignalingMessageType.OFFER,
      from: this.peerId,
      to: toPeerId,
      roomId: this.roomId,
      payload: { offer },
      timestamp: Date.now()
    });
  }

  /**
   * Sends a WebRTC answer to a specific peer
   */
  sendAnswer(toPeerId: string, answer: RTCSessionDescriptionInit): void {
    if (!this.roomId) return;

    this.sendMessage({
      type: SignalingMessageType.ANSWER,
      from: this.peerId,
      to: toPeerId,
      roomId: this.roomId,
      payload: { answer },
      timestamp: Date.now()
    });
  }

  /**
   * Sends an ICE candidate to a specific peer
   */
  sendIceCandidate(toPeerId: string, candidate: RTCIceCandidateInit): void {
    if (!this.roomId) return;

    this.sendMessage({
      type: SignalingMessageType.ICE_CANDIDATE,
      from: this.peerId,
      to: toPeerId,
      roomId: this.roomId,
      payload: { candidate },
      timestamp: Date.now()
    });
  }

  /**
   * Checks if we should use SFU based on peer count
   */
  shouldUseSfu(): boolean {
    return this.peers.size > this.config.sfuThreshold;
  }

  /**
   * Gets the current peer count
   */
  getPeerCount(): number {
    return this.peers.size;
  }

  /**
   * Gets all peers in the room
   */
  getPeers(): RoomPeer[] {
    return Array.from(this.peers.values());
  }

  /**
   * Gets the local peer ID
   */
  getLocalPeerId(): string {
    return this.peerId;
  }

  /**
   * Checks if this peer is the host
   */
  isRoomHost(): boolean {
    return this.isHost;
  }

  /**
   * Registers an event handler
   */
  on<K extends keyof SignalingEvents>(event: K, handler: SignalingEvents[K]): void {
    this.eventHandlers[event] = handler;
  }

  /**
   * Removes an event handler
   */
  off<K extends keyof SignalingEvents>(event: K): void {
    delete this.eventHandlers[event];
  }

  // Private methods

  private sendMessage(message: SignalingMessage): void {
    const data = JSON.stringify(message);
    
    if (message.to) {
      // Direct message to specific peer
      this.client.sendToPeer(message.to, data);
    } else {
      // Broadcast to all
      this.broadcast(message);
    }
  }

  private broadcast(message: SignalingMessage): void {
    if (!this.roomId) return;
    
    HyperswarmWebClient.hashTopic(`p2pigeon-room-${this.roomId}`).then(topicHex => {
      this.client.broadcast(topicHex, JSON.stringify(message));
    });
  }

  private handleIncomingMessage(data: ArrayBuffer | string): void {
    try {
      const messageStr = typeof data === 'string' ? data : new TextDecoder().decode(data);
      const message: SignalingMessage = JSON.parse(messageStr);

      // Ignore our own messages
      if (message.from === this.peerId) return;

      // Ignore messages for other rooms
      if (message.roomId !== this.roomId) return;

      // Ignore messages not meant for us (if targeted)
      if (message.to && message.to !== this.peerId) return;

      console.log('[Signaling] Received:', message.type, 'from:', message.from.substring(0, 8));

      switch (message.type) {
        case SignalingMessageType.JOIN:
          this.handlePeerJoin(message);
          break;
        case SignalingMessageType.LEAVE:
          this.handlePeerLeave(message);
          break;
        case SignalingMessageType.OFFER:
          this.triggerEvent('onOffer', message.from, message.payload.offer);
          break;
        case SignalingMessageType.ANSWER:
          this.triggerEvent('onAnswer', message.from, message.payload.answer);
          break;
        case SignalingMessageType.ICE_CANDIDATE:
          this.triggerEvent('onIceCandidate', message.from, message.payload.candidate);
          break;
        case SignalingMessageType.PEER_LIST:
          this.handlePeerList(message);
          break;
        case SignalingMessageType.SFU_REDIRECT:
          this.triggerEvent('onSfuRedirect', message.payload.sfuUrl);
          break;
      }
    } catch (error) {
      console.error('[Signaling] Error parsing message:', error);
    }
  }

  private handlePeerJoin(message: SignalingMessage): void {
    const peer = message.payload.peer as RoomPeer;
    this.peers.set(peer.peerId, peer);
    this.triggerEvent('onPeerJoined', peer);

    // If we're the host, send the peer list
    if (this.isHost) {
      this.sendMessage({
        type: SignalingMessageType.PEER_LIST,
        from: this.peerId,
        to: peer.peerId,
        roomId: this.roomId!,
        payload: { 
          peers: Array.from(this.peers.values()),
          config: this.config
        },
        timestamp: Date.now()
      });

      // Check if we should redirect to SFU
      if (this.shouldUseSfu() && this.config.sfuServerUrl) {
        this.broadcast({
          type: SignalingMessageType.SFU_REDIRECT,
          from: this.peerId,
          roomId: this.roomId!,
          payload: { sfuUrl: this.config.sfuServerUrl },
          timestamp: Date.now()
        });
      }
    }
  }

  private handlePeerLeave(message: SignalingMessage): void {
    this.peers.delete(message.from);
    this.triggerEvent('onPeerLeft', message.from);
  }

  private handlePeerList(message: SignalingMessage): void {
    const { peers, config } = message.payload;
    
    // Update our peer list
    for (const peer of peers) {
      if (peer.peerId !== this.peerId) {
        this.peers.set(peer.peerId, peer);
      }
    }
    
    this.config = config;
    this.triggerEvent('onRoomInfo', peers, config);
  }

  private triggerEvent<K extends keyof SignalingEvents>(
    event: K, 
    ...args: Parameters<SignalingEvents[K]>
  ): void {
    const handler = this.eventHandlers[event] as ((...args: any[]) => void) | undefined;
    if (handler) {
      handler(...args);
    }
  }
}

export default HyperswarmSignaling;
