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
 * Core type definitions for the Pigeon application
 * P2Pigeon includes enhanced security, connection management, and
 * file transfer capabilities as part of its design goals.
 */

// Unique identifier types
export type PeerId = string;
export type RoomId = string;
export type MessageId = string;
export type FileId = string;

// Protocol types for P2P communication (video/audio/data)
export enum CommunicationProtocol {
  WEBRTC = 'webrtc',       // Browser-native WebRTC (requires signaling server)
  HYPERSWARM = 'hyperswarm', // Holepunch DHT-based P2P (via relay for browsers)
  NOSTR = 'nostr'          // Nostr protocol for messaging
}

// Nostr is used as a separate messaging layer, not a communication protocol
export enum MessagingProtocol {
  NOSTR = 'nostr',         // Decentralized relay-based messaging
  DATACHANNEL = 'datachannel' // WebRTC data channel (requires active P2P connection)
}

// Encryption algorithms supported
export type EncryptionAlgorithm = 'AES-GCM' | 'ChaCha20-Poly1305' | 'NIP-04';

// Connection status
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

// Peer information
export interface Peer {
  audioEnabled?: boolean;
  videoEnabled?: boolean;
  id: PeerId;
  publicKey?: string;
  displayName?: string;
  avatarUrl?: string;
  connectionStatus: ConnectionStatus;
  protocolType: CommunicationProtocol;
  lastSeen?: Date;
  isLocal: boolean;
  capabilities?: PeerCapabilities;
}

// Peer capabilities for feature negotiation
export interface PeerCapabilities {
  supportsEncryption: boolean;
  supportedEncryptionAlgorithms?: EncryptionAlgorithm[];
  supportsFileTransfer: boolean;
  supportsVideo: boolean;
  supportsAudio: boolean;
  maxFileSize?: number;
  extensionsSupported?: string[];
}

// Message type for chat
export interface Message {
  id: MessageId;
  senderId: PeerId;
  roomId: RoomId;
  content: string;
  timestamp: Date;
  isEncrypted: boolean;
  /**
   * Indicates if a message was successfully decrypted
   * - undefined: No encryption/decryption was attempted
   * - true: Message was successfully decrypted
   * - false: Message is encrypted but decryption failed
   */
  isDecrypted?: boolean;
  readBy: PeerId[];
  contentType: 'text' | 'image' | 'file' | 'system';
  replyToId?: MessageId;
}

// File transfer types
export interface FileMetadata {
  id: FileId;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  hash?: string;
  chunks: number;
  ownerId: PeerId;
}

export interface TransferProgress {
  fileId: FileId;
  senderId: PeerId;
  receiverId: PeerId;
  bytesTransferred: number;
  totalBytes: number;
  status: 'queued' | 'in-progress' | 'completed' | 'error' | 'canceled';
  error?: string;
  startTime: Date;
  endTime?: Date;
  transferRate?: number; // bytes per second
  estimatedTimeRemaining?: number; // milliseconds
  chunksTransferred: number;
  totalChunks: number;
}

// Alias for backward compatibility
export type FileTransferProgress = TransferProgress;

export enum MediaStreamType {
  AUDIO = 'audio',
  VIDEO = 'video',
  SCREEN = 'screen'
}

// Room types for video or data sharing
export interface Room {
  id: RoomId;
  name?: string;
  createdAt: Date;
  createdBy: PeerId;
  participants: Peer[];
  type: 'video' | 'data';
  isEncrypted: boolean;
  protocolType: CommunicationProtocol;
  maxParticipants?: number;
}

// Protocol-specific configuration
export interface ProtocolConfig {
  protocol: CommunicationProtocol;
  enabled: boolean;
  config: WebRTCConfig | NostrConfig | HypernatConfig;
}

export interface WebRTCConfig extends Record<string, unknown> {
  iceServers: Array<{
    urls: string[];
    username?: string;
    credential?: string;
  }>;
  maxRetries: number;
  peerConnectionOptions?: RTCConfiguration;
}

export interface NostrConfig extends Record<string, unknown> {
  relays?: string[];
  privateKey?: string;
  publicKey?: string;
  defaultRelays?: string[];
  connectionTimeout?: number;
  messageKinds?: number[];
}

export interface HyperswarmConfig extends Record<string, unknown> {
  relayUrl?: string;              // WebSocket URL for DHT relay (browser)
  bootstrap?: string[];           // DHT bootstrap nodes
  peerPublicKey?: string;
  maxPeers?: number;
  ephemeral?: boolean;
  enableEncryption?: boolean;
  securityConfig?: SecurityConfig;
}

// Alias for backward compatibility
export type HypernatConfig = HyperswarmConfig;

// Security configuration
export interface SecurityConfig {
  enableE2EEncryption: boolean;
  encryptionAlgorithm: EncryptionAlgorithm;
  keyRotationInterval: number; // milliseconds
  enablePFS: boolean; // Perfect Forward Secrecy
}

// Connection metrics for monitoring and diagnostics
export interface ConnectionMetrics {
  latency: number; // milliseconds
  lastConnected: number; // timestamp
  connectionAttempts: number;
  successfulConnections: number;
  failedConnections: number;
}

// Encryption key data
export interface EncryptionKey {
  key: CryptoKey;
  iv: Uint8Array;
  algorithm: EncryptionAlgorithm;
  createdAt: number; // timestamp
  expiresAt?: number; // timestamp
}

// Room encryption details
export interface RoomEncryptionDetails {
  roomId: RoomId;
  encryptionEnabled: boolean;
  currentKey?: EncryptionKey;
  previousKeys: EncryptionKey[];
  keyRotationScheduled: boolean;
}
