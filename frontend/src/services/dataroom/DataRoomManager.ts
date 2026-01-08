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
 * DataRoom Manager
 * 
 * Manages secure file storage and sharing using P2P technology.
 * Provides encrypted file rooms with access control.
 */
import { 
  FileId, 
  FileMetadata, 
  PeerId, 
  RoomId,
  TransferProgress 
} from '../../types/core';

export interface DataRoomConfig {
  maxFileSize?: number; // bytes, default 100MB
  chunkSize?: number; // bytes, default 64KB
  encryptionEnabled?: boolean;
}

export interface DataRoomFile extends FileMetadata {
  roomId: RoomId;
  encryptionKey?: CryptoKey;
  chunkData: ArrayBuffer[];
  uploadProgress: number;
  downloadProgress: number;
  isComplete: boolean;
}

export interface DataRoom {
  id: RoomId;
  name: string;
  createdAt: Date;
  createdBy: PeerId;
  accessList: PeerId[];
  files: Map<FileId, DataRoomFile>;
  isEncrypted: boolean;
  encryptionKey?: CryptoKey;
}

export type DataRoomEventCallback = {
  onFileAdded: (roomId: RoomId, file: DataRoomFile) => void;
  onFileRemoved: (roomId: RoomId, fileId: FileId) => void;
  onTransferProgress: (progress: TransferProgress) => void;
  onTransferComplete: (fileId: FileId) => void;
  onTransferError: (fileId: FileId, error: Error) => void;
  onAccessGranted: (roomId: RoomId, peerId: PeerId) => void;
  onAccessRevoked: (roomId: RoomId, peerId: PeerId) => void;
};

const DEFAULT_CONFIG: Required<DataRoomConfig> = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  chunkSize: 64 * 1024, // 64KB
  encryptionEnabled: true
};

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

export class DataRoomManager {
  private config: Required<DataRoomConfig>;
  private rooms: Map<RoomId, DataRoom> = new Map();
  private localPeerId: PeerId;
  private eventHandlers: Partial<Record<keyof DataRoomEventCallback, Set<Function>>> = {};
  private pendingTransfers: Map<FileId, AbortController> = new Map();

  constructor(localPeerId: PeerId, config?: DataRoomConfig) {
    this.localPeerId = localPeerId;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Create a new secure data room
   */
  async createRoom(name: string, isEncrypted = true): Promise<DataRoom> {
    const roomId = generateUUID() as RoomId;
    
    let encryptionKey: CryptoKey | undefined;
    if (isEncrypted && this.config.encryptionEnabled) {
      encryptionKey = await this.generateEncryptionKey();
    }

    const room: DataRoom = {
      id: roomId,
      name,
      createdAt: new Date(),
      createdBy: this.localPeerId,
      accessList: [this.localPeerId],
      files: new Map(),
      isEncrypted,
      encryptionKey
    };

    this.rooms.set(roomId, room);
    return room;
  }

  /**
   * Get a data room by ID
   */
  getRoom(roomId: RoomId): DataRoom | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * List all accessible data rooms
   */
  listRooms(): DataRoom[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Grant access to a peer
   */
  grantAccess(roomId: RoomId, peerId: PeerId): void {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);
    if (room.createdBy !== this.localPeerId) {
      throw new Error('Only room creator can grant access');
    }

    if (!room.accessList.includes(peerId)) {
      room.accessList.push(peerId);
      this.triggerEvent('onAccessGranted', roomId, peerId);
    }
  }

  /**
   * Revoke access from a peer
   */
  revokeAccess(roomId: RoomId, peerId: PeerId): void {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);
    if (room.createdBy !== this.localPeerId) {
      throw new Error('Only room creator can revoke access');
    }

    const index = room.accessList.indexOf(peerId);
    if (index > -1) {
      room.accessList.splice(index, 1);
      this.triggerEvent('onAccessRevoked', roomId, peerId);
    }
  }

  /**
   * Check if a peer has access to a room
   */
  hasAccess(roomId: RoomId, peerId: PeerId): boolean {
    const room = this.rooms.get(roomId);
    return room ? room.accessList.includes(peerId) : false;
  }

  /**
   * Upload a file to a data room
   */
  async uploadFile(roomId: RoomId, file: File): Promise<FileId> {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);
    if (!this.hasAccess(roomId, this.localPeerId)) {
      throw new Error('Access denied');
    }
    if (file.size > this.config.maxFileSize) {
      throw new Error(`File size exceeds maximum of ${this.config.maxFileSize / (1024 * 1024)}MB`);
    }

    const fileId = generateUUID() as FileId;
    const abortController = new AbortController();
    this.pendingTransfers.set(fileId, abortController);

    try {
      // Read file into chunks
      const chunks = await this.chunkFile(file, abortController.signal);
      
      // Encrypt if room is encrypted
      let processedChunks = chunks;
      let encryptionKey: CryptoKey | undefined;
      
      if (room.isEncrypted && room.encryptionKey) {
        encryptionKey = room.encryptionKey;
        processedChunks = await this.encryptChunks(chunks, encryptionKey);
      }

      // Calculate hash for integrity verification
      const hash = await this.calculateFileHash(file);

      const dataRoomFile: DataRoomFile = {
        id: fileId,
        roomId,
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        hash,
        chunks: processedChunks.length,
        ownerId: this.localPeerId,
        encryptionKey,
        chunkData: processedChunks,
        uploadProgress: 100,
        downloadProgress: 0,
        isComplete: true
      };

      room.files.set(fileId, dataRoomFile);
      this.triggerEvent('onFileAdded', roomId, dataRoomFile);
      this.triggerEvent('onTransferComplete', fileId);

      return fileId;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.triggerEvent('onTransferError', fileId, new Error('Upload cancelled'));
      } else {
        this.triggerEvent('onTransferError', fileId, error instanceof Error ? error : new Error(String(error)));
      }
      throw error;
    } finally {
      this.pendingTransfers.delete(fileId);
    }
  }

  /**
   * Download a file from a data room
   */
  async downloadFile(roomId: RoomId, fileId: FileId): Promise<Blob> {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);
    if (!this.hasAccess(roomId, this.localPeerId)) {
      throw new Error('Access denied');
    }

    const file = room.files.get(fileId);
    if (!file) throw new Error(`File ${fileId} not found`);

    try {
      let chunkData = file.chunkData;

      // Decrypt if necessary
      if (room.isEncrypted && file.encryptionKey) {
        chunkData = await this.decryptChunks(chunkData, file.encryptionKey);
      }

      // Combine chunks into blob
      const blob = new Blob(chunkData, { type: file.type });

      // Verify integrity
      if (file.hash) {
        const downloadedHash = await this.calculateBlobHash(blob);
        if (downloadedHash !== file.hash) {
          throw new Error('File integrity check failed');
        }
      }

      this.triggerEvent('onTransferComplete', fileId);
      return blob;
    } catch (error) {
      this.triggerEvent('onTransferError', fileId, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Remove a file from a data room
   */
  removeFile(roomId: RoomId, fileId: FileId): void {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);
    
    const file = room.files.get(fileId);
    if (!file) return;

    // Only owner or room creator can remove
    if (file.ownerId !== this.localPeerId && room.createdBy !== this.localPeerId) {
      throw new Error('Only file owner or room creator can remove files');
    }

    room.files.delete(fileId);
    this.triggerEvent('onFileRemoved', roomId, fileId);
  }

  /**
   * Cancel an ongoing transfer
   */
  cancelTransfer(fileId: FileId): void {
    const controller = this.pendingTransfers.get(fileId);
    if (controller) {
      controller.abort();
    }
  }

  /**
   * List files in a data room
   */
  listFiles(roomId: RoomId): FileMetadata[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    
    return Array.from(room.files.values()).map(f => ({
      id: f.id,
      name: f.name,
      size: f.size,
      type: f.type,
      lastModified: f.lastModified,
      hash: f.hash,
      chunks: f.chunkData.length,
      ownerId: f.ownerId
    }));
  }

  /**
   * Delete a data room
   */
  deleteRoom(roomId: RoomId): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    
    if (room.createdBy !== this.localPeerId) {
      throw new Error('Only room creator can delete room');
    }

    this.rooms.delete(roomId);
  }

  /**
   * Export room encryption key for sharing
   */
  async exportRoomKey(roomId: RoomId): Promise<string | null> {
    const room = this.rooms.get(roomId);
    if (!room || !room.encryptionKey) return null;

    const exported = await crypto.subtle.exportKey('raw', room.encryptionKey);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  }

  /**
   * Import room encryption key
   */
  async importRoomKey(roomId: RoomId, keyString: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);

    const keyData = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    room.encryptionKey = key;
    room.isEncrypted = true;
  }

  // Event handling
  on<K extends keyof DataRoomEventCallback>(event: K, callback: DataRoomEventCallback[K]): void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = new Set();
    }
    this.eventHandlers[event]!.add(callback);
  }

  off<K extends keyof DataRoomEventCallback>(event: K, callback: DataRoomEventCallback[K]): void {
    this.eventHandlers[event]?.delete(callback);
  }

  private triggerEvent<K extends keyof DataRoomEventCallback>(
    event: K,
    ...args: Parameters<DataRoomEventCallback[K]>
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

  // Private helper methods
  private async generateEncryptionKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  private async chunkFile(file: File, signal: AbortSignal): Promise<ArrayBuffer[]> {
    const chunks: ArrayBuffer[] = [];
    const totalChunks = Math.ceil(file.size / this.config.chunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      
      const start = i * this.config.chunkSize;
      const end = Math.min(start + this.config.chunkSize, file.size);
      const slice = file.slice(start, end);
      const buffer = await slice.arrayBuffer();
      chunks.push(buffer);

      // Report progress
      const progress: TransferProgress = {
        fileId: '' as FileId, // Will be set by caller
        senderId: this.localPeerId,
        receiverId: this.localPeerId,
        bytesTransferred: end,
        totalBytes: file.size,
        status: 'in-progress',
        startTime: new Date(),
        chunksTransferred: i + 1,
        totalChunks
      };
      this.triggerEvent('onTransferProgress', progress);
    }

    return chunks;
  }

  private async encryptChunks(chunks: ArrayBuffer[], key: CryptoKey): Promise<ArrayBuffer[]> {
    const encryptedChunks: ArrayBuffer[] = [];
    
    for (const chunk of chunks) {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        chunk
      );
      
      // Prepend IV to encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encrypted), iv.length);
      encryptedChunks.push(combined.buffer);
    }

    return encryptedChunks;
  }

  private async decryptChunks(chunks: ArrayBuffer[], key: CryptoKey): Promise<ArrayBuffer[]> {
    const decryptedChunks: ArrayBuffer[] = [];
    
    for (const chunk of chunks) {
      const data = new Uint8Array(chunk);
      const iv = data.slice(0, 12);
      const encrypted = data.slice(12);
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );
      
      decryptedChunks.push(decrypted);
    }

    return decryptedChunks;
  }

  private async calculateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async calculateBlobHash(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

export default DataRoomManager;
