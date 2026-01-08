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
 * WebRTC Protocol Adapter Implementation
 * 
 * This adapter implements the ProtocolAdapter interface using native WebRTC
 * for peer-to-peer audio/video communication with Socket.io signaling.
 * Supports both browser and Electron environments.
 */
import { io, Socket } from 'socket.io-client';
import { ProtocolAdapter, ProtocolEvents } from './ProtocolAdapter';
import { sanitizeSDP, sanitizeIceCandidate } from './sdpUtils';
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
  WebRTCConfig
} from '../../types/core';

/**
 * Generate a UUID v4 using browser's crypto API
 */
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

/**
 * Default ICE servers for STUN/TURN
 */
const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

/**
 * Maximum reconnection attempts
 */

/**
 * Video quality presets - from MiroTalk
 */
export type VideoQuality = 'qvgaVideo' | 'vgaVideo' | 'hdVideo' | 'fhdVideo' | '2kVideo' | '4kVideo' | '6kVideo' | '8kVideo';
const MAX_RECONNECTION_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY = 1000;

interface PeerConnectionState {
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  remoteStream: MediaStream | null;
  iceCandidates: RTCIceCandidate[];
}

export class WebRTCAdapter implements ProtocolAdapter {
  readonly protocolType = CommunicationProtocol.WEBRTC;
  
  private socket: Socket | null = null;
  private config!: WebRTCConfig;
  private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private localPeer: Peer;
  private remotePeers: Map<PeerId, Peer> = new Map();
  private peerConnections: Map<PeerId, PeerConnectionState> = new Map();
  private rooms: Map<RoomId, Room> = new Map();
  private fileTransfers: Map<FileId, FileMetadata> = new Map();
  private eventHandlers: Partial<Record<keyof ProtocolEvents, Set<Function>>> = {};
  private localStream: MediaStream | null = null;
  private currentRoomId: RoomId | null = null;
  private reconnectionAttempts = 0;
  private signalingServerUrl = import.meta.env.VITE_SIGNALING_URL || window.location.origin;

  constructor(config?: WebRTCConfig) {
    const peerId = generateUUID();
    
    this.localPeer = {
      id: peerId as PeerId,
      connectionStatus: ConnectionStatus.DISCONNECTED,
      protocolType: CommunicationProtocol.WEBRTC,
      isLocal: true,
      capabilities: {
        supportsEncryption: true,
        supportedEncryptionAlgorithms: ['AES-GCM'],
        supportsFileTransfer: true,
        supportsVideo: true,
        supportsAudio: true
      }
    };
    
    if (config) {
      this.config = config;
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.cleanup());
    }
  }

  async initialize(config: WebRTCConfig | Record<string, unknown>): Promise<void> {
    console.log('[WebRTC] 🚀 Initializing WebRTCAdapter...');
    console.log('[WebRTC] Config:', config);
    
    this.config = {
      iceServers: (config as WebRTCConfig).iceServers || DEFAULT_ICE_SERVERS.map(s => ({ urls: Array.isArray(s.urls) ? s.urls : [s.urls] })),
      maxRetries: (config as WebRTCConfig).maxRetries || MAX_RECONNECTION_ATTEMPTS,
      peerConnectionOptions: (config as WebRTCConfig).peerConnectionOptions
    };

    console.log('[WebRTC] ICE Servers:', this.config.iceServers);
    this.connectionStatus = ConnectionStatus.CONNECTING;

    // Don't create socket during initialization - create fresh on join
    // This prevents stale socket issues and race conditions
    if (import.meta.env.VITE_SIGNALING_URL) {
      this.signalingServerUrl = import.meta.env.VITE_SIGNALING_URL;
    } else if (import.meta.env.DEV) {
      // Use direct backend URL in development (Vite proxy unreliable)
      this.signalingServerUrl = 'http://localhost:3060';
    } else {
      this.signalingServerUrl = window.location.origin;
    }
    console.log('[WebRTC] 📍 Signaling server configured:', this.signalingServerUrl || '(using proxy)');
    console.log('[WebRTC] 📋 Socket will be created when joining a room');

    // WebRTC adapter is ready even without signaling server
    // Local media and single-device features will work
    this.connectionStatus = ConnectionStatus.CONNECTED;
    this.localPeer.connectionStatus = ConnectionStatus.CONNECTED;
    this.reconnectionAttempts = 0;
    
    console.log('[WebRTC] ✅ Adapter initialized successfully');
    console.log('[WebRTC] Local Peer ID:', this.localPeer.id);
  }

  private setupSocketHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[WebRTC] 🔗 Socket connected to signaling server');
      this.connectionStatus = ConnectionStatus.CONNECTED;
      this.triggerEvent('onPeerStatusChange', this.localPeer.id, ConnectionStatus.CONNECTED);
    });

    this.socket.on('disconnect', () => {
      console.log('[WebRTC] 🔌 Socket disconnected from signaling server');
      this.connectionStatus = ConnectionStatus.DISCONNECTED;
      this.triggerEvent('onPeerStatusChange', this.localPeer.id, ConnectionStatus.DISCONNECTED);
    });

    // Handle new peer joining
    this.socket.on('addPeer', async (data: { peer_id: string; peers: Record<string, unknown>; should_create_offer: boolean }) => {
      console.log('[WebRTC] 👤 Peer added:', data.peer_id);
      console.log('[WebRTC] Should create offer:', data.should_create_offer);
      console.log('[WebRTC] All peers:', data.peers);
      
      const peerId = data.peer_id as PeerId;
      
      // Create peer object
      const peer: Peer = {
        id: peerId,
        connectionStatus: ConnectionStatus.CONNECTING,
        protocolType: CommunicationProtocol.WEBRTC,
        isLocal: false,
        capabilities: {
          supportsEncryption: true,
          supportsFileTransfer: true,
          supportsVideo: true,
          supportsAudio: true
        }
      };
      
      this.remotePeers.set(peerId, peer);
      
      // Create RTCPeerConnection
      await this.createPeerConnection(peerId);
      
      // If we should create offer, do so
      if (data.should_create_offer) {
        await this.createAndSendOffer(peerId);
      }
      
      this.triggerEvent('onPeerConnect', peer);
    });

    // Handle peer leaving
    this.socket.on('removePeer', (data: { peer_id: string }) => {
      const peerId = data.peer_id as PeerId;
      console.log('[WebRTC] 👋 Peer removed:', peerId);
      
      this.closePeerConnection(peerId);
      this.remotePeers.delete(peerId);
      
      this.triggerEvent('onPeerDisconnect', peerId);
    });

    // Handle incoming ICE candidate
    this.socket.on('iceCandidate', async (data: { peer_id: string; ice_candidate: RTCIceCandidateInit }) => {
      const peerId = data.peer_id as PeerId;
      console.log('[WebRTC] 🧊 ICE candidate received from:', peerId);
      const peerState = this.peerConnections.get(peerId);
      
      if (peerState && data.ice_candidate) {
        try {
          await peerState.connection.addIceCandidate(new RTCIceCandidate(data.ice_candidate));
          console.log('[WebRTC] ✅ Added ICE candidate from', peerId);
        } catch (error) {
          console.error('[WebRTC] ❌ Error adding ICE candidate:', error);
        }
      }
    });

    // Handle incoming SDP (offer or answer)
    this.socket.on('sessionDescription', async (data: { peer_id: string; session_description: RTCSessionDescriptionInit }) => {
      const peerId = data.peer_id as PeerId;
      console.log('[WebRTC] 📋 SDP received from:', peerId, 'type:', data.session_description.type);
      const peerState = this.peerConnections.get(peerId);
      
      if (!peerState) {
        console.error('[WebRTC] ❌ No peer connection for', peerId);
        return;
      }

      try {
        const description = new RTCSessionDescription(data.session_description);
        await peerState.connection.setRemoteDescription(description);
        console.log('[WebRTC] ✅ Set remote description from', peerId, description.type);

        // If we received an offer, create and send answer
        if (description.type === 'offer') {
          console.log('[WebRTC] 📤 Creating answer for', peerId);
          const answer = await peerState.connection.createAnswer();
          
          // Sanitize SDP to strip metadata before sending
          const sanitizedSdp = sanitizeSDP(answer.sdp || '');
          const sanitizedAnswer: RTCSessionDescriptionInit = {
            type: answer.type,
            sdp: sanitizedSdp
          };
          
          await peerState.connection.setLocalDescription(sanitizedAnswer);
          
          console.log('[WebRTC] 🔒 Sending sanitized SDP answer');
          this.socket?.emit('relaySDP', {
            peer_id: peerId,
            session_description: sanitizedAnswer
          });
          console.log('[WebRTC] ✅ Sent answer to', peerId);
        }
      } catch (error) {
        console.error('[WebRTC] ❌ Error handling session description:', error);
      }
    });
  }

  private async createPeerConnection(peerId: PeerId): Promise<void> {
    const iceServers = this.config?.iceServers?.map(s => ({
      urls: s.urls,
      username: s.username,
      credential: s.credential
    })) || DEFAULT_ICE_SERVERS;

    const connection = new RTCPeerConnection({
      iceServers,
      ...this.config?.peerConnectionOptions
    });

    const peerState: PeerConnectionState = {
      connection,
      dataChannel: null,
      remoteStream: null,
      iceCandidates: []
    };

    // Handle ICE candidates with privacy filtering
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        // Sanitize candidate to strip private network info
        const sanitizedCandidate = sanitizeIceCandidate(event.candidate);
        if (sanitizedCandidate) {
          console.log('[WebRTC] 🔒 Sending sanitized ICE candidate');
          this.socket?.emit('relayICE', {
            peer_id: peerId,
            ice_candidate: sanitizedCandidate
          });
        } else {
          console.log('[WebRTC] 🛡️ Filtered private ICE candidate');
        }
      }
    };

    // Handle connection state changes
    connection.onconnectionstatechange = () => {
      console.log(`[WebRTC] 🔄 Connection state with ${peerId}:`, connection.connectionState);
      
      const peer = this.remotePeers.get(peerId);
      if (peer) {
        switch (connection.connectionState) {
          case 'connected':
            peer.connectionStatus = ConnectionStatus.CONNECTED;
            break;
          case 'disconnected':
          case 'failed':
          case 'closed':
            peer.connectionStatus = ConnectionStatus.DISCONNECTED;
            break;
          case 'connecting':
            peer.connectionStatus = ConnectionStatus.CONNECTING;
            break;
        }
        this.triggerEvent('onPeerStatusChange', peerId, peer.connectionStatus);
      }
    };

    // Handle incoming tracks (remote media)
    connection.ontrack = (event) => {
      console.log('[WebRTC] 🎥 Received remote track from', peerId, event.track.kind);
      
      if (event.streams && event.streams[0]) {
        peerState.remoteStream = event.streams[0];
        this.triggerEvent('onRemoteStreamAdded', peerId, event.streams[0]);
      }
    };

    // Add local stream tracks if available with high quality encoding
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        const sender = connection.addTrack(track, this.localStream!);
        
        // Set optimized encoding parameters for low latency video
        if (track.kind === 'video' && sender) {
          const params = sender.getParameters();
          if (!params.encodings) {
            params.encodings = [{}];
          }
          // Optimize for low latency with high quality
          params.encodings[0].maxBitrate = 2500000;
          params.encodings[0].priority = 'high';
          params.encodings[0].networkPriority = 'high';
          // Prefer maintaining framerate over resolution when bandwidth is limited
          params.degradationPreference = 'maintain-framerate';
          sender.setParameters(params).catch(err => 
            console.warn('[WebRTC] Could not set video encoding params:', err)
          );
        }
      });
    }

    // Create data channel for messaging/file transfer
    const dataChannel = connection.createDataChannel('pigeon-data', {
      ordered: true
    });
    
    dataChannel.onopen = () => {
      console.log('[WebRTC] 📡 Data channel opened with', peerId);
    };
    
    dataChannel.onmessage = (event) => {
      this.handleDataChannelMessage(peerId, event.data);
    };
    
    peerState.dataChannel = dataChannel;

    // Handle incoming data channels
    connection.ondatachannel = (event) => {
      const channel = event.channel;
      channel.onmessage = (msgEvent) => {
        this.handleDataChannelMessage(peerId, msgEvent.data);
      };
    };

    this.peerConnections.set(peerId, peerState);
  }

  private async createAndSendOffer(peerId: PeerId): Promise<void> {
    const peerState = this.peerConnections.get(peerId);
    if (!peerState) return;

    try {
      const offer = await peerState.connection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      // Sanitize SDP to strip metadata before sending
      const sanitizedSdp = sanitizeSDP(offer.sdp || '');
      const sanitizedOffer: RTCSessionDescriptionInit = {
        type: offer.type,
        sdp: sanitizedSdp
      };
      
      await peerState.connection.setLocalDescription(sanitizedOffer);
      
      console.log('[WebRTC] 🔒 Sending sanitized SDP offer');
      this.socket?.emit('relaySDP', {
        peer_id: peerId,
        session_description: sanitizedOffer
      });
      
      console.log('[WebRTC] ✅ Sent offer to', peerId);
    } catch (error) {
      console.error('[WebRTC] ❌ Error creating offer:', error);
    }
  }

  private handleDataChannelMessage(peerId: PeerId, data: string | ArrayBuffer): void {
    try {
      if (typeof data === 'string') {
        const message = JSON.parse(data);
        
        if (message.type === 'chat') {
          const chatMessage: Message = {
            id: generateUUID() as MessageId,
            senderId: peerId,
            roomId: this.currentRoomId || ('' as RoomId),
            content: message.content,
            timestamp: new Date(message.timestamp),
            isEncrypted: false,
            readBy: [this.localPeer.id],
            contentType: 'text'
          };
          this.triggerEvent('onMessageReceived', chatMessage);
        } else if (message.type === 'host_mute') {
          // Host is muting/unmuting this peer
          console.log('[WebRTC] Received mute command from host:', message.muted);
          if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
              track.enabled = !message.muted;
            });
          }
          this.triggerEvent('onHostMute', message.muted);
        } else if (message.type === 'host_kick') {
          // Host is kicking this peer from the room
          console.log('[WebRTC] Received kick command from host');
          this.triggerEvent('onHostKick', peerId);
          // Leave the room
          if (this.currentRoomId) {
            this.leaveRoom(this.currentRoomId);
          }
        } else if (message.type === 'meeting_ended') {
          // Host has ended the meeting for everyone
          console.log('[WebRTC] Meeting ended by host');
          this.triggerEvent('onMeetingEnded', {
            endedBy: peerId,
            reason: message.reason || 'Host ended the meeting'
          });
        }
      }
    } catch (error) {
      console.error('Error handling data channel message:', error);
    }
  }

  private closePeerConnection(peerId: PeerId): void {
    const peerState = this.peerConnections.get(peerId);
    if (peerState) {
      peerState.dataChannel?.close();
      peerState.connection.close();
      
      if (peerState.remoteStream) {
        this.triggerEvent('onRemoteStreamRemoved', peerId);
      }
      
      this.peerConnections.delete(peerId);
    }
  }

  async connect(): Promise<void> {
    if (this.connectionStatus === ConnectionStatus.CONNECTED) return;
    
    if (!this.socket) {
      await this.initialize(this.config || {});
    }
  }

  async disconnect(): Promise<void> {
    // Close all peer connections
    for (const [peerId] of this.peerConnections) {
      this.closePeerConnection(peerId);
    }
    
    // Disconnect from signaling server
    this.socket?.disconnect();
    this.socket = null;
    
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
    const roomId = (options?.roomId as string) || generateUUID();
    return this.joinRoom(roomId as RoomId);
  }

  async joinRoom(roomId: RoomId): Promise<Room> {
    console.log('[WebRTC] 🚪 Joining room:', roomId);
    
    const signalingUrl = this.signalingServerUrl;
    
    // Force create a fresh socket connection for reliability
    if (this.socket) {
      console.log('[WebRTC] 🔄 Disconnecting existing socket...');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    
    console.log('[WebRTC] 🔧 Creating new socket connection to:', signalingUrl);
    this.socket = io(signalingUrl, {
      // Use polling first for reliability, then upgrade to websocket
      transports: ['polling', 'websocket'],
      upgrade: true,
      timeout: 15000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      forceNew: true,
      // Prevent connection issues with long polling
      rememberUpgrade: true,
    });
    
    this.setupSocketHandlers();
    
    // Wait for connection with robust error handling
    console.log('[WebRTC] ⏳ Waiting for socket connection...');
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('[WebRTC] ❌ Connection timeout after 10s');
        reject(new Error('Connection timeout - signaling server may be down'));
      }, 10000);
      
      const cleanup = () => {
        clearTimeout(timeout);
        this.socket?.off('connect', onConnect);
        this.socket?.off('connect_error', onError);
      };
      
      const onConnect = () => {
        cleanup();
        console.log('[WebRTC] ✅ Connected to signaling server, socket ID:', this.socket?.id);
        resolve();
      };
      
      const onError = (err: Error) => {
        console.error('[WebRTC] ❌ Connection error:', err.message);
        // Don't reject immediately on first error - socket.io will retry
        // Only reject if we've exhausted retries or timeout
      };
      
      this.socket!.on('connect', onConnect);
      this.socket!.on('connect_error', onError);
      
      // Also listen for disconnect during connection attempt
      this.socket!.once('disconnect', (reason) => {
        if (reason === 'io server disconnect' || reason === 'io client disconnect') {
          cleanup();
          reject(new Error(`Disconnected during join: ${reason}`));
        }
      });
    });

    this.currentRoomId = roomId;

    // Join the Socket.io room
    const joinConfig = {
      channel: roomId,
      peer_name: this.localPeer.displayName || `User_${Date.now()}`,
      peer_uuid: this.localPeer.id,
      peer_token: '',
      peer_info: {
        peer_video: true,
        peer_audio: true,
        peer_screen: false,
        peer_recording: false
      },
      ipLookup: { enabled: false }
    };

    console.log('[WebRTC] 📤 Emitting join event:', joinConfig);
    this.socket.emit('join', joinConfig);

    const room: Room = {
      id: roomId,
      name: `Room ${roomId.substring(0, 8)}`,
      createdAt: new Date(),
      createdBy: this.localPeer.id,
      participants: [this.localPeer],
      type: 'video',
      isEncrypted: true,
      protocolType: CommunicationProtocol.WEBRTC
    };

    this.rooms.set(roomId, room);
    this.triggerEvent('onRoomJoined', room);
    
    return room;
  }

  async leaveRoom(roomId: RoomId): Promise<void> {
    if (this.socket && this.currentRoomId === roomId) {
      this.socket.emit('leave', { channel: roomId });
    }
    
    // Close all peer connections in this room
    for (const [peerId] of this.peerConnections) {
      this.closePeerConnection(peerId);
    }
    
    this.rooms.delete(roomId);
    this.currentRoomId = null;
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
    const message: Message = {
      id: generateUUID() as MessageId,
      senderId: this.localPeer.id,
      roomId,
      content,
      timestamp: new Date(),
      isEncrypted: false,
      readBy: [this.localPeer.id],
      contentType,
      replyToId
    };

    // Send to all peers via data channel
    const dataMessage = JSON.stringify({
      type: 'chat',
      content,
      timestamp: message.timestamp.toISOString(),
      replyToId
    });

    for (const [, peerState] of this.peerConnections) {
      if (peerState.dataChannel?.readyState === 'open') {
        peerState.dataChannel.send(dataMessage);
      }
    }

    return message;
  }

  async deleteMessage(messageId: MessageId): Promise<void> {
    // Broadcast delete to all peers
    const deleteMessage = JSON.stringify({
      type: 'delete',
      messageId
    });

    for (const [, peerState] of this.peerConnections) {
      if (peerState.dataChannel?.readyState === 'open') {
        peerState.dataChannel.send(deleteMessage);
      }
    }
  }

  /**
   * Broadcast meeting ended to all participants (host only)
   */
  broadcastMeetingEnded(reason: string = 'Host ended the meeting'): void {
    const endMessage = JSON.stringify({
      type: 'meeting_ended',
      reason
    });

    for (const [, peerState] of this.peerConnections) {
      if (peerState.dataChannel?.readyState === 'open') {
        peerState.dataChannel.send(endMessage);
      }
    }
    console.log('[WebRTC] Broadcasted meeting ended to all participants');
  }

  async sendFile(roomId: RoomId, file: File): Promise<FileId> {
    const fileId = generateUUID() as FileId;
    
    const metadata: FileMetadata = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      chunks: Math.ceil(file.size / (64 * 1024)),
      ownerId: this.localPeer.id
    };

    this.fileTransfers.set(fileId, metadata);

    // TODO: Implement chunked file transfer via data channel
    console.log('File transfer initiated:', metadata);

    return fileId;
  }

  async cancelFileTransfer(fileId: FileId): Promise<void> {
    this.fileTransfers.delete(fileId);
  }

  getAvailableFiles(roomId: RoomId): FileMetadata[] {
    return Array.from(this.fileTransfers.values());
  }

  async downloadFile(fileId: FileId): Promise<Blob> {
    throw new Error('File download not yet implemented');
  }

  // Video quality presets from MiroTalk - supports up to 8K
  private videoQuality: VideoQuality = 'hdVideo';
  
  /**
   * Get video constraints based on quality setting
   * From MiroTalk: https://github.com/miroslavpejic85/mirotalk
   */
  getVideoConstraints(quality: VideoQuality = this.videoQuality): MediaTrackConstraints {
    const presets: Record<VideoQuality, { width: number; height: number; frameRate: number }> = {
      qvgaVideo: { width: 320, height: 240, frameRate: 30 },
      vgaVideo: { width: 640, height: 480, frameRate: 30 },
      hdVideo: { width: 1280, height: 720, frameRate: 30 },
      fhdVideo: { width: 1920, height: 1080, frameRate: 30 },
      '2kVideo': { width: 2560, height: 1440, frameRate: 30 },
      '4kVideo': { width: 3840, height: 2160, frameRate: 30 },
      '6kVideo': { width: 6144, height: 3456, frameRate: 30 },
      '8kVideo': { width: 7680, height: 4320, frameRate: 60 },
    };
    
    const preset = presets[quality] || presets.hdVideo;
    return {
      width: { ideal: preset.width },
      height: { ideal: preset.height },
      frameRate: { ideal: preset.frameRate },
    };
  }

  /**
   * Set video quality and optionally apply to current stream
   */
  async setVideoQuality(quality: VideoQuality, applyNow: boolean = true): Promise<void> {
    this.videoQuality = quality;
    console.log('[WebRTC] Video quality set to:', quality);
    
    if (applyNow && this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        const constraints = this.getVideoConstraints(quality);
        try {
          await videoTrack.applyConstraints(constraints);
          console.log('[WebRTC] Applied new video constraints:', videoTrack.getSettings());
        } catch (err) {
          console.warn('[WebRTC] Device may not support this quality:', err);
        }
      }
    }
  }

  async startLocalStream(audioDeviceId?: string, videoDeviceId?: string): Promise<MediaStream> {
    // Video constraints based on quality setting (default HD, supports up to 8K)
    const videoConstraints: MediaTrackConstraints = {
      ...this.getVideoConstraints(),
      ...(videoDeviceId ? { deviceId: { exact: videoDeviceId } } : {})
    };

    // Audio constraints from MiroTalk - high quality
    const audioConstraints: MediaTrackConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000,
      channelCount: 2,
      ...(audioDeviceId ? { deviceId: { exact: audioDeviceId } } : {})
    };

    const constraints: MediaStreamConstraints = {
      audio: audioConstraints,
      video: videoConstraints
    };

    this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
    
    console.log('[WebRTC] 🎥 Local stream started:', {
      video: {
        width: this.localStream.getVideoTracks()[0]?.getSettings().width,
        height: this.localStream.getVideoTracks()[0]?.getSettings().height,
        frameRate: this.localStream.getVideoTracks()[0]?.getSettings().frameRate,
        label: this.localStream.getVideoTracks()[0]?.label
      },
      audio: {
        sampleRate: this.localStream.getAudioTracks()[0]?.getSettings().sampleRate,
        label: this.localStream.getAudioTracks()[0]?.label
      }
    });

    // Add tracks to existing peer connections with high quality encoding
    for (const [, peerState] of this.peerConnections) {
      this.localStream.getTracks().forEach(track => {
        const sender = peerState.connection.addTrack(track, this.localStream!);
        
        // Set high bitrate for video tracks
        if (track.kind === 'video' && sender) {
          const params = sender.getParameters();
          if (!params.encodings) {
            params.encodings = [{}];
          }
          params.encodings[0].maxBitrate = 2500000;
          sender.setParameters(params).catch(err => 
            console.warn('[WebRTC] Could not set encoding params:', err)
          );
        }
      });
    }

    return this.localStream;
  }

  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  /**
   * Replace video track in all peer connections (for screen sharing)
   */
  async replaceVideoTrack(newTrack: MediaStreamTrack): Promise<void> {
    console.log('[WebRTC] Replacing video track for screen share');
    
    for (const [peerId, peerState] of this.peerConnections) {
      const senders = peerState.connection.getSenders();
      const videoSender = senders.find(s => s.track?.kind === 'video');
      
      if (videoSender) {
        try {
          await videoSender.replaceTrack(newTrack);
          console.log('[WebRTC] Replaced video track for peer:', peerId);
        } catch (err) {
          console.error('[WebRTC] Failed to replace track for peer:', peerId, err);
        }
      }
    }
  }

  /**
   * Stop screen sharing and switch back to camera
   */
  async stopScreenShare(): Promise<void> {
    console.log('[WebRTC] Stopping screen share');
    
    if (this.localStream) {
      const cameraTrack = this.localStream.getVideoTracks()[0];
      if (cameraTrack) {
        await this.replaceVideoTrack(cameraTrack);
      }
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

  private cleanup(): void {
    this.stopLocalStream();
    this.disconnect();
    this.removeAllListeners();
  }

  /**
   * Send a mute command to a specific peer (host control)
   */
  muteParticipant(peerId: PeerId, muted: boolean): void {
    const peerState = this.peerConnections.get(peerId);
    if (peerState?.dataChannel?.readyState === 'open') {
      const command = JSON.stringify({
        type: 'host_mute',
        muted: muted,
        timestamp: Date.now()
      });
      peerState.dataChannel.send(command);
      console.log(`[WebRTC] Sent mute command to ${peerId}: muted=${muted}`);
      
      // Update participant state locally
      const peer = this.remotePeers.get(peerId);
      if (peer) {
        (peer as any).mutedByHost = muted;
        this.triggerEvent('onPeerUpdated', peerId, peer);
      }
    } else {
      console.warn(`[WebRTC] Cannot send mute command - data channel not open for ${peerId}`);
    }
  }

  /**
   * Kick a participant from the room (host control)
   */
  kickParticipant(peerId: PeerId): void {
    const peerState = this.peerConnections.get(peerId);
    if (peerState?.dataChannel?.readyState === 'open') {
      const command = JSON.stringify({
        type: 'host_kick',
        timestamp: Date.now()
      });
      peerState.dataChannel.send(command);
      console.log(`[WebRTC] Sent kick command to ${peerId}`);
    }
    
    // Close the peer connection regardless of data channel state
    this.closePeerConnection(peerId);
    this.remotePeers.delete(peerId);
    this.triggerEvent('onPeerLeft', peerId);
  }
}
