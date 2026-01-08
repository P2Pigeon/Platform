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
 * Protocol Adapter Interface
 * 
 * This defines the common interface that all protocol implementations
 * must follow to ensure a unified communication layer across WebRTC,
 * Nostr, and Hypernat protocols.
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

export interface ProtocolEvents {
  onPeerConnect: (peer: Peer) => void;
  onPeerDisconnect: (peerId: PeerId) => void;
  onPeerStatusChange: (peerId: PeerId, status: ConnectionStatus) => void;
  onPeerUpdated: (peerId: PeerId, peer: Peer) => void;
  onPeerLeft: (peerId: PeerId) => void;
  onMessageReceived: (message: Message) => void;
  onFileTransferProgress: (fileId: FileId, senderId: PeerId, receiverId: PeerId, progress: number) => void;
  onFileTransferComplete: (fileId: FileId) => void;
  onFileTransferError: (fileId: FileId, error: Error) => void;
  onRoomCreated: (room: Room) => void;
  onRoomJoined: (room: Room) => void;
  onRoomLeft: (roomId: RoomId) => void;
  onError: (error: Error) => void;
  onRemoteStreamAdded: (peerId: PeerId, stream: MediaStream) => void;
  onRemoteStreamRemoved: (peerId: PeerId) => void;
  onHostMute: (muted: boolean) => void;
  onHostKick: (hostPeerId: PeerId) => void;
  onMeetingEnded: (data: { endedBy: PeerId; reason: string }) => void;
}

export interface ProtocolAdapter {
  readonly protocolType: CommunicationProtocol;
  
  // Connection management
  initialize(config: WebRTCConfig | NostrConfig | HypernatConfig): Promise<void>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getConnectionStatus(): ConnectionStatus;
  
  // Peer management
  getCurrentPeer(): Peer;
  getPeers(): Peer[];
  
  // Room operations
  createRoom(options?: Record<string, unknown>): Promise<Room>;
  joinRoom(roomId: RoomId): Promise<Room>;
  leaveRoom(roomId: RoomId): Promise<void>;
  getRooms(): Room[];
  
  // Messaging
  sendMessage(roomId: RoomId, content: string, contentType?: 'text' | 'image' | 'file' | 'system', replyToId?: MessageId): Promise<Message>;
  deleteMessage(messageId: MessageId): Promise<void>;
  
  // File transfer
  sendFile(roomId: RoomId, file: File): Promise<FileId>;
  cancelFileTransfer(fileId: FileId): Promise<void>;
  getAvailableFiles(roomId: RoomId): FileMetadata[];
  downloadFile(fileId: FileId): Promise<Blob>;
  
  // Media handling for video calls
  startLocalStream(audioDeviceId?: string, videoDeviceId?: string): Promise<MediaStream>;
  stopLocalStream(): void;
  getLocalStream(): MediaStream | null;
  
  // Host controls
  muteParticipant?(peerId: PeerId, muted: boolean): void;
  kickParticipant?(peerId: PeerId): void;
  
  // Event handling
  on<K extends keyof ProtocolEvents>(event: K, callback: ProtocolEvents[K]): void;
  off<K extends keyof ProtocolEvents>(event: K, callback: ProtocolEvents[K]): void;
  removeAllListeners<K extends keyof ProtocolEvents>(event?: K): void;
}
