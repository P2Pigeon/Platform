/**
 * Data Room Service
 * 
 * Simple file-based data room implementation for development.
 * Will be replaced with Hyperdrive-based implementation for production.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import Logs from '../logs';

const log = new Logs('dataroom-service');

// Access type for data rooms
export enum DataRoomAccessType {
  OPEN = 'open',           // Anyone with link can access
  CLOSED = 'closed'        // Requires approval from owner
}

// Access request status
export enum AccessRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

// Access request from a user
export interface AccessRequest {
  id: string;
  userId: string;
  userName?: string;
  email?: string;
  message?: string;        // NDA acknowledgment or request message
  agreedToTerms: boolean;  // Whether they agreed to NDA/terms
  status: AccessRequestStatus;
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

export interface DataRoom {
  id: string;
  name: string;
  description?: string;
  owner: string;
  participants: string[];
  createdAt: Date;
  lastModified: Date;
  fileCount: number;
  totalSize: number;
  // Access control
  accessType: DataRoomAccessType;
  ndaText?: string;         // Custom NDA/terms text for closed rooms
  accessRequests: AccessRequest[];
  connectedUsers: string[]; // Currently connected users
}

export interface DataRoomFile {
  id: string;
  path: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
  checksum: string;
}

interface DataRoomServiceConfig {
  storagePath: string;
}

/**
 * Simple file-based data room service
 */
export class DataRoomService {
  private config: DataRoomServiceConfig;
  private rooms: Map<string, DataRoom> = new Map();
  private isInitialized = false;

  constructor(config: DataRoomServiceConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    log.info('Initializing Data Room Service...');

    // Ensure storage directory exists
    if (!fs.existsSync(this.config.storagePath)) {
      fs.mkdirSync(this.config.storagePath, { recursive: true });
    }

    // Load existing rooms from disk
    const roomsFile = path.join(this.config.storagePath, 'rooms.json');
    if (fs.existsSync(roomsFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(roomsFile, 'utf-8'));
        for (const room of data) {
          this.rooms.set(room.id, room);
        }
        log.info(`Loaded ${this.rooms.size} existing rooms`);
      } catch (err) {
        log.warn('Failed to load rooms from disk:', err);
      }
    }

    this.isInitialized = true;
    log.info('Data Room Service initialized');
  }

  private saveRooms(): void {
    const roomsFile = path.join(this.config.storagePath, 'rooms.json');
    fs.writeFileSync(roomsFile, JSON.stringify(Array.from(this.rooms.values()), null, 2));
  }

  async createDataRoom(
    name: string,
    ownerId: string,
    options?: { 
      description?: string; 
      accessType?: DataRoomAccessType;
      ndaText?: string;
    }
  ): Promise<DataRoom> {
    const roomId = crypto.randomUUID();
    const roomPath = path.join(this.config.storagePath, roomId);

    // Create room directory
    fs.mkdirSync(roomPath, { recursive: true });

    const room: DataRoom = {
      id: roomId,
      name,
      description: options?.description,
      owner: ownerId,
      participants: [ownerId],
      createdAt: new Date(),
      lastModified: new Date(),
      fileCount: 0,
      totalSize: 0,
      // Access control
      accessType: options?.accessType || DataRoomAccessType.OPEN,
      ndaText: options?.ndaText,
      accessRequests: [],
      connectedUsers: [ownerId]
    };

    this.rooms.set(roomId, room);
    this.saveRooms();

    log.info(`Created data room: ${roomId} - ${name} (${room.accessType})`);

    return room;
  }

  async joinDataRoom(roomId: string, userId: string): Promise<DataRoom> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Data room not found: ${roomId}`);
    }

    // For closed rooms, check if user has access
    // But still return room info so they can request access
    const isApproved = room.participants.includes(userId) || room.owner === userId;
    
    if (room.accessType === DataRoomAccessType.CLOSED && !isApproved) {
      // User can view room but not files - they need to request access
      // Mark as connected but not as participant
      if (!room.connectedUsers.includes(userId)) {
        room.connectedUsers.push(userId);
      }
      this.saveRooms();
      log.info(`User ${userId} viewing closed room (pending access): ${roomId}`);
      return room;
    }

    // Open rooms or approved users get full access
    if (!room.participants.includes(userId)) {
      room.participants.push(userId);
    }
    
    // Mark user as connected
    if (!room.connectedUsers.includes(userId)) {
      room.connectedUsers.push(userId);
    }
    
    this.saveRooms();
    log.info(`User ${userId} joined room: ${roomId}`);

    return room;
  }
  
  // Check if user has access to room files
  hasFileAccess(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    
    if (room.accessType === DataRoomAccessType.OPEN) return true;
    return room.participants.includes(userId) || room.owner === userId;
  }
  
  // Get user's access status for a room
  getUserAccessStatus(roomId: string, userId: string): 'owner' | 'approved' | 'pending' | 'none' {
    const room = this.rooms.get(roomId);
    if (!room) return 'none';
    
    if (room.owner === userId) return 'owner';
    if (room.participants.includes(userId)) return 'approved';
    
    const pendingRequest = room.accessRequests.find(
      r => r.userId === userId && r.status === AccessRequestStatus.PENDING
    );
    if (pendingRequest) return 'pending';
    
    return 'none';
  }

  // Request access to a closed room
  async requestAccess(
    roomId: string, 
    userId: string, 
    options: { userName?: string; email?: string; message?: string; agreedToTerms: boolean }
  ): Promise<AccessRequest> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Data room not found: ${roomId}`);
    }

    // Check if already a participant
    if (room.participants.includes(userId)) {
      throw new Error('User already has access to this room');
    }

    // Check if request already exists
    const existingRequest = room.accessRequests.find(r => r.userId === userId && r.status === AccessRequestStatus.PENDING);
    if (existingRequest) {
      throw new Error('Access request already pending');
    }

    const request: AccessRequest = {
      id: crypto.randomUUID(),
      userId,
      userName: options.userName,
      email: options.email,
      message: options.message,
      agreedToTerms: options.agreedToTerms,
      status: AccessRequestStatus.PENDING,
      requestedAt: new Date()
    };

    room.accessRequests.push(request);
    this.saveRooms();

    log.info(`Access request from ${userId} for room ${roomId}`);
    return request;
  }

  // Approve access request
  async approveAccess(roomId: string, requestId: string, reviewerId: string): Promise<AccessRequest> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Data room not found: ${roomId}`);
    }

    // Only owner can approve
    if (room.owner !== reviewerId) {
      throw new Error('Only room owner can approve access requests');
    }

    const request = room.accessRequests.find(r => r.id === requestId);
    if (!request) {
      throw new Error('Access request not found');
    }

    request.status = AccessRequestStatus.APPROVED;
    request.reviewedAt = new Date();
    request.reviewedBy = reviewerId;

    // Add to participants
    if (!room.participants.includes(request.userId)) {
      room.participants.push(request.userId);
    }

    this.saveRooms();
    log.info(`Access approved for ${request.userId} to room ${roomId}`);
    return request;
  }

  // Reject access request
  async rejectAccess(roomId: string, requestId: string, reviewerId: string): Promise<AccessRequest> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Data room not found: ${roomId}`);
    }

    if (room.owner !== reviewerId) {
      throw new Error('Only room owner can reject access requests');
    }

    const request = room.accessRequests.find(r => r.id === requestId);
    if (!request) {
      throw new Error('Access request not found');
    }

    request.status = AccessRequestStatus.REJECTED;
    request.reviewedAt = new Date();
    request.reviewedBy = reviewerId;

    this.saveRooms();
    log.info(`Access rejected for ${request.userId} to room ${roomId}`);
    return request;
  }

  // Remove user access
  async removeAccess(roomId: string, userId: string, removerId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Data room not found: ${roomId}`);
    }

    if (room.owner !== removerId) {
      throw new Error('Only room owner can remove user access');
    }

    if (userId === room.owner) {
      throw new Error('Cannot remove owner from room');
    }

    room.participants = room.participants.filter(p => p !== userId);
    room.connectedUsers = room.connectedUsers.filter(u => u !== userId);

    this.saveRooms();
    log.info(`Access removed for ${userId} from room ${roomId}`);
  }

  // User connects to room
  connectUser(roomId: string, userId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    if (!room.connectedUsers.includes(userId)) {
      room.connectedUsers.push(userId);
      this.saveRooms();
    }
  }

  // User disconnects from room
  disconnectUser(roomId: string, userId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.connectedUsers = room.connectedUsers.filter(u => u !== userId);
    this.saveRooms();
  }

  // Get pending access requests for a room
  getPendingRequests(roomId: string): AccessRequest[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return room.accessRequests.filter(r => r.status === AccessRequestStatus.PENDING);
  }

  getDataRoom(roomId: string): DataRoom | undefined {
    return this.rooms.get(roomId);
  }

  async listFiles(roomId: string): Promise<DataRoomFile[]> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Data room not found: ${roomId}`);
    }

    const roomPath = path.join(this.config.storagePath, roomId);
    const files: DataRoomFile[] = [];

    if (fs.existsSync(roomPath)) {
      const entries = fs.readdirSync(roomPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile() && entry.name !== 'metadata.json') {
          const filePath = path.join(roomPath, entry.name);
          const stats = fs.statSync(filePath);
          const metadataPath = path.join(roomPath, `${entry.name}.meta.json`);
          
          let metadata: Partial<DataRoomFile> = {};
          if (fs.existsSync(metadataPath)) {
            try {
              metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
            } catch {}
          }

          files.push({
            id: metadata.id || crypto.randomUUID(),
            path: `/${entry.name}`,
            name: entry.name,
            size: stats.size,
            mimeType: metadata.mimeType || 'application/octet-stream',
            uploadedBy: metadata.uploadedBy || 'unknown',
            uploadedAt: metadata.uploadedAt ? new Date(metadata.uploadedAt) : stats.mtime,
            checksum: metadata.checksum || ''
          });
        }
      }
    }

    return files;
  }

  async uploadFile(
    roomId: string,
    fileName: string,
    fileBuffer: Buffer,
    uploadedBy: string,
    mimeType?: string
  ): Promise<DataRoomFile> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Data room not found: ${roomId}`);
    }

    const roomPath = path.join(this.config.storagePath, roomId);
    const filePath = path.join(roomPath, fileName);
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Write file
    fs.writeFileSync(filePath, fileBuffer);

    // Write metadata
    const fileMetadata: DataRoomFile = {
      id: crypto.randomUUID(),
      path: `/${fileName}`,
      name: fileName,
      size: fileBuffer.length,
      mimeType: mimeType || 'application/octet-stream',
      uploadedBy,
      uploadedAt: new Date(),
      checksum
    };

    fs.writeFileSync(
      path.join(roomPath, `${fileName}.meta.json`),
      JSON.stringify(fileMetadata, null, 2)
    );

    // Update room stats
    room.fileCount++;
    room.totalSize += fileBuffer.length;
    room.lastModified = new Date();
    this.saveRooms();

    log.info(`File uploaded to room ${roomId}: ${fileName} (${fileBuffer.length} bytes)`);

    return fileMetadata;
  }

  async downloadFile(roomId: string, filePath: string, userId: string): Promise<Buffer> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Data room not found: ${roomId}`);
    }

    const roomPath = path.join(this.config.storagePath, roomId);
    const fileName = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    const fullPath = path.join(roomPath, fileName);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    log.info(`File downloaded from room ${roomId}: ${fileName}`);

    return fs.readFileSync(fullPath);
  }

  async deleteFile(roomId: string, filePath: string, userId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Data room not found: ${roomId}`);
    }

    const roomPath = path.join(this.config.storagePath, roomId);
    const fileName = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    const fullPath = path.join(roomPath, fileName);
    const metaPath = path.join(roomPath, `${fileName}.meta.json`);

    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      fs.unlinkSync(fullPath);
      
      if (fs.existsSync(metaPath)) {
        fs.unlinkSync(metaPath);
      }

      room.fileCount = Math.max(0, room.fileCount - 1);
      room.totalSize = Math.max(0, room.totalSize - stats.size);
      room.lastModified = new Date();
      this.saveRooms();

      log.info(`File deleted from room ${roomId}: ${fileName}`);
    }
  }
}

export default DataRoomService;
