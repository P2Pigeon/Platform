/**
 * Hyperdrive Manager for Data Rooms
 * 
 * Manages encrypted file storage and sharing using Hyperdrive.
 * Provides P2P file transfer with sparse replication.
 * 
 * TRUE P2P IMPLEMENTATION:
 * - Files are stored in Hyperdrive (append-only log with sparse replication)
 * - Data persists as long as any peer with the data is online
 * - No central server storage - data lives on peer devices
 * - Storage limit = combined storage of all connected peers
 */

import Hyperswarm from 'hyperswarm';
import Hypercore from 'hypercore';
import Hyperdrive from 'hyperdrive';
import Corestore from 'corestore';
import Localdrive from 'localdrive';
import b4a from 'b4a';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import Logs from '../logs';

const log = new Logs('hyperdrive-manager');

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
  message?: string;
  agreedToTerms: boolean;
  status: AccessRequestStatus;
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

/**
 * Data room permissions
 */
export interface DataRoomPermissions {
  canRead: string[];
  canWrite: string[];
  canDelete: string[];
  isPublic: boolean;
}

/**
 * Data room metadata
 */
export interface DataRoom {
  id: string;
  driveKey: string;
  name: string;
  description?: string;
  owner: string;
  participants: string[];
  permissions: DataRoomPermissions;
  createdAt: Date;
  lastModified: Date;
  fileCount: number;
  totalSize: number;
  // Access control
  accessType: DataRoomAccessType;
  ndaText?: string;
  accessRequests: AccessRequest[];
  connectedUsers: string[];
}

/**
 * File metadata in a data room
 */
export interface DataRoomFile {
  path: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
  checksum: string;
  isDirectory: boolean;
  // Media viewer settings
  downloadable: boolean;
  viewOnly: boolean;
  // Stats
  viewCount: number;
  downloadCount: number;
}

/**
 * Per-user stats for NDA tracking
 */
export interface FileUserStat {
  userId: string;
  userName?: string;
  viewCount: number;
  downloadCount: number;
  lastViewedAt?: Date;
  lastDownloadedAt?: Date;
}

/**
 * File stats response
 */
export interface FileStats {
  fileId: string;
  fileName: string;
  filePath: string;
  totalViews: number;
  totalDownloads: number;
  userStats?: FileUserStat[];
}

/**
 * File transfer progress
 */
export interface FileTransferProgress {
  fileId: string;
  path: string;
  totalBytes: number;
  transferredBytes: number;
  percentage: number;
  speed: number;
  eta: number;
  status: 'pending' | 'transferring' | 'completed' | 'failed';
}

/**
 * Hyperdrive Manager Configuration
 */
export interface HyperdriveManagerConfig {
  storagePath: string;
  bootstrap?: string[];
}

/**
 * Manages Hyperdrive-based data rooms for secure file sharing
 */
// DHT announcement status for each drive
interface DHTStatus {
  driveKey: string;
  announced: boolean;
  lastAttempt: Date;
  retryCount: number;
  error?: string;
}

// File stats storage (per room -> per file path)
interface FileStatsData {
  viewCount: number;
  downloadCount: number;
  userStats: Map<string, FileUserStat>;
}

export class HyperdriveManager {
  private swarm: typeof Hyperswarm | null = null;
  private corestore: typeof Corestore | null = null;
  private drives: Map<string, typeof Hyperdrive> = new Map();
  private dataRooms: Map<string, DataRoom> = new Map();
  private config: HyperdriveManagerConfig;
  private isInitialized = false;
  
  // File metadata (downloadable/viewOnly settings)
  private fileMetadata: Map<string, Map<string, { downloadable: boolean; viewOnly: boolean }>> = new Map();
  
  // Stats tracking (roomId -> filePath -> stats)
  private fileStats: Map<string, Map<string, FileStatsData>> = new Map();
  
  // DHT hardening
  private dhtStatus: Map<string, DHTStatus> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly MAX_RETRIES = 5;
  private readonly RETRY_DELAYS = [1000, 5000, 15000, 30000, 60000]; // Exponential backoff
  private readonly HEALTH_CHECK_INTERVAL = 60000; // 1 minute

  constructor(config: HyperdriveManagerConfig) {
    this.config = config;
  }

  /**
   * Initializes the Hyperdrive manager
   * Uses timeout to prevent blocking on slow network operations
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    log.info('Initializing Hyperdrive Manager...');

    // Ensure storage directory exists
    if (!fs.existsSync(this.config.storagePath)) {
      fs.mkdirSync(this.config.storagePath, { recursive: true });
    }

    // Initialize Corestore with timeout
    this.corestore = new Corestore(path.join(this.config.storagePath, 'corestore'));
    
    try {
      await Promise.race([
        this.corestore.ready(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Corestore init timeout')), 5000)
        )
      ]);
    } catch (err) {
      log.warn('Corestore initialization slow, continuing...', err);
    }

    // Initialize Hyperswarm for P2P connections (non-blocking)
    this.swarm = new Hyperswarm();

    // Handle new peer connections
    this.swarm.on('connection', (conn: any, info: any) => {
      log.info('New peer connection for drive replication');
      // Replicate all drives with this peer
      for (const [key, drive] of this.drives) {
        drive.replicate(conn);
      }
    });

    // Start DHT health monitoring in background
    this.startHealthMonitoring();

    this.isInitialized = true;
    log.info('Hyperdrive Manager initialized (DHT connecting in background)');
  }

  /**
   * Announces a drive to DHT with retry logic
   */
  private async announceToDHT(driveKey: string, drive: any, retryCount = 0): Promise<boolean> {
    if (!this.swarm) return false;

    const status: DHTStatus = this.dhtStatus.get(driveKey) || {
      driveKey,
      announced: false,
      lastAttempt: new Date(),
      retryCount: 0
    };

    try {
      status.lastAttempt = new Date();
      status.retryCount = retryCount;
      this.dhtStatus.set(driveKey, status);

      const discovery = this.swarm.join(drive.discoveryKey);
      
      // Use a timeout to prevent hanging forever
      await Promise.race([
        discovery.flushed(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('DHT announcement timeout')), 30000)
        )
      ]);

      status.announced = true;
      status.error = undefined;
      this.dhtStatus.set(driveKey, status);
      log.info(`✓ DHT announced: ${driveKey.substring(0, 8)}... (attempt ${retryCount + 1})`);
      return true;

    } catch (err: any) {
      status.announced = false;
      status.error = err.message;
      this.dhtStatus.set(driveKey, status);

      if (retryCount < this.MAX_RETRIES) {
        const delay = this.RETRY_DELAYS[Math.min(retryCount, this.RETRY_DELAYS.length - 1)];
        log.warn(`DHT announcement failed for ${driveKey.substring(0, 8)}..., retrying in ${delay}ms (attempt ${retryCount + 1}/${this.MAX_RETRIES})`);
        
        setTimeout(() => {
          this.announceToDHT(driveKey, drive, retryCount + 1);
        }, delay);
      } else {
        log.error(`DHT announcement failed after ${this.MAX_RETRIES} attempts: ${driveKey.substring(0, 8)}...`);
      }
      return false;
    }
  }

  /**
   * Starts background health monitoring for DHT connections
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) return;

    this.healthCheckInterval = setInterval(() => {
      this.checkAndReannounce();
    }, this.HEALTH_CHECK_INTERVAL);

    log.info('DHT health monitoring started');
  }

  /**
   * Checks all drives and re-announces any that failed
   */
  private async checkAndReannounce(): Promise<void> {
    const failedDrives: string[] = [];

    for (const [driveKey, status] of this.dhtStatus) {
      if (!status.announced) {
        failedDrives.push(driveKey);
      }
    }

    if (failedDrives.length > 0) {
      log.info(`Re-announcing ${failedDrives.length} failed drives to DHT...`);
      
      for (const driveKey of failedDrives) {
        const drive = this.drives.get(driveKey);
        if (drive) {
          // Reset retry count for health check re-announcements
          this.announceToDHT(driveKey, drive, 0);
        }
      }
    }
  }

  /**
   * Get DHT status for all drives
   */
  getDHTStatus(): { total: number; announced: number; failed: number; drives: DHTStatus[] } {
    const drives = Array.from(this.dhtStatus.values());
    return {
      total: drives.length,
      announced: drives.filter(d => d.announced).length,
      failed: drives.filter(d => !d.announced).length,
      drives
    };
  }

  /**
   * Force re-announce all drives to DHT
   */
  async forceReannounceAll(): Promise<void> {
    log.info('Force re-announcing all drives to DHT...');
    for (const [driveKey, drive] of this.drives) {
      await this.announceToDHT(driveKey, drive, 0);
    }
  }

  private saveRooms(): void {
    const roomsFile = path.join(this.config.storagePath, 'rooms.json');
    fs.writeFileSync(roomsFile, JSON.stringify(Array.from(this.dataRooms.values()), null, 2));
  }

  private loadRooms(): void {
    const roomsFile = path.join(this.config.storagePath, 'rooms.json');
    if (fs.existsSync(roomsFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(roomsFile, 'utf-8'));
        for (const room of data) {
          this.dataRooms.set(room.id, room);
        }
        log.info(`Loaded ${this.dataRooms.size} existing rooms`);
      } catch (err) {
        log.warn('Failed to load rooms from disk:', err);
      }
    }
    
    // Load file metadata
    const metadataFile = path.join(this.config.storagePath, 'file-metadata.json');
    if (fs.existsSync(metadataFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(metadataFile, 'utf-8'));
        for (const [roomId, files] of Object.entries(data)) {
          this.fileMetadata.set(roomId, new Map(Object.entries(files as Record<string, any>)));
        }
      } catch (err) {
        log.warn('Failed to load file metadata:', err);
      }
    }
    
    // Load stats
    const statsFile = path.join(this.config.storagePath, 'file-stats.json');
    if (fs.existsSync(statsFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(statsFile, 'utf-8'));
        for (const [roomId, files] of Object.entries(data)) {
          const roomStats = new Map<string, FileStatsData>();
          for (const [filePath, stats] of Object.entries(files as Record<string, any>)) {
            roomStats.set(filePath, {
              viewCount: stats.viewCount || 0,
              downloadCount: stats.downloadCount || 0,
              userStats: new Map(Object.entries(stats.userStats || {}))
            });
          }
          this.fileStats.set(roomId, roomStats);
        }
      } catch (err) {
        log.warn('Failed to load file stats:', err);
      }
    }
  }
  
  private saveFileMetadata(): void {
    const metadataFile = path.join(this.config.storagePath, 'file-metadata.json');
    const data: Record<string, Record<string, any>> = {};
    for (const [roomId, files] of this.fileMetadata) {
      data[roomId] = Object.fromEntries(files);
    }
    fs.writeFileSync(metadataFile, JSON.stringify(data, null, 2));
  }
  
  private saveFileStats(): void {
    const statsFile = path.join(this.config.storagePath, 'file-stats.json');
    const data: Record<string, Record<string, any>> = {};
    for (const [roomId, files] of this.fileStats) {
      data[roomId] = {};
      for (const [filePath, stats] of files) {
        data[roomId][filePath] = {
          viewCount: stats.viewCount,
          downloadCount: stats.downloadCount,
          userStats: Object.fromEntries(stats.userStats)
        };
      }
    }
    fs.writeFileSync(statsFile, JSON.stringify(data, null, 2));
  }

  /**
   * Creates a new data room with a Hyperdrive
   */
  async createDataRoom(
    name: string,
    ownerId: string,
    options?: {
      description?: string;
      isPublic?: boolean;
      accessType?: DataRoomAccessType;
      ndaText?: string;
    }
  ): Promise<DataRoom> {
    if (!this.corestore) {
      throw new Error('Hyperdrive Manager not initialized');
    }

    log.info(`Creating data room: ${name}`);

    // Create a new Hyperdrive with timeout to prevent blocking
    const drive = new Hyperdrive(this.corestore);
    
    try {
      await Promise.race([
        drive.ready(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Drive ready timeout')), 3000)
        )
      ]);
    } catch (err) {
      log.warn('Hyperdrive ready slow, continuing with local state:', err);
    }

    const driveKey = drive.key ? b4a.toString(drive.key, 'hex') : crypto.randomUUID();
    const roomId = crypto.randomUUID();

    // Store the drive
    this.drives.set(driveKey, drive);

    // Announce to DHT with retry logic (non-blocking)
    // Room creation returns immediately, DHT announcement happens in background
    this.announceToDHT(driveKey, drive, 0);

    // Create data room metadata
    const dataRoom: DataRoom = {
      id: roomId,
      driveKey,
      name,
      description: options?.description,
      owner: ownerId,
      participants: [ownerId],
      permissions: {
        canRead: [ownerId],
        canWrite: [ownerId],
        canDelete: [ownerId],
        isPublic: options?.isPublic ?? false
      },
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

    this.dataRooms.set(roomId, dataRoom);
    this.saveRooms();

    // Write room metadata to drive (non-blocking with timeout)
    Promise.race([
      drive.put('/.pigeon/room.json', Buffer.from(JSON.stringify(dataRoom))),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Drive put timeout')), 2000)
      )
    ]).catch(err => log.warn('Drive metadata write deferred:', err));

    log.info(`Data room created: ${roomId} with drive key: ${driveKey.substring(0, 16)}...`);

    return dataRoom;
  }

  /**
   * Joins an existing data room by drive key
   */
  async joinDataRoom(driveKeyHex: string, userId: string): Promise<DataRoom> {
    if (!this.corestore || !this.swarm) {
      throw new Error('Hyperdrive Manager not initialized');
    }

    log.info(`Joining data room with key: ${driveKeyHex.substring(0, 16)}...`);

    const driveKey = b4a.from(driveKeyHex, 'hex');

    // Create drive from existing key (read-only by default)
    const drive = new Hyperdrive(this.corestore, driveKey);
    await drive.ready();

    // Store the drive
    this.drives.set(driveKeyHex, drive);

    // Join swarm to find peers
    const discovery = this.swarm.join(drive.discoveryKey);
    await discovery.flushed();

    // Wait for initial sync
    await drive.update();

    // Read room metadata
    let dataRoom: DataRoom;
    try {
      const metadataBuffer = await drive.get('/.pigeon/room.json');
      if (metadataBuffer) {
        dataRoom = JSON.parse(metadataBuffer.toString());
        // Add this user as participant if allowed
        if (!dataRoom.participants.includes(userId)) {
          dataRoom.participants.push(userId);
        }
      } else {
        throw new Error('Room metadata not found');
      }
    } catch (err) {
      // Create default metadata if not found
      dataRoom = {
        id: crypto.randomUUID(),
        driveKey: driveKeyHex,
        name: `Room ${driveKeyHex.substring(0, 8)}`,
        owner: 'unknown',
        participants: [userId],
        permissions: {
          canRead: [userId],
          canWrite: [],
          canDelete: [],
          isPublic: true
        },
        createdAt: new Date(),
        lastModified: new Date(),
        fileCount: 0,
        totalSize: 0,
        accessType: DataRoomAccessType.OPEN,
        accessRequests: [],
        connectedUsers: [userId]
      };
    }

    this.dataRooms.set(dataRoom.id, dataRoom);

    log.info(`Joined data room: ${dataRoom.name}`);

    return dataRoom;
  }

  /**
   * Uploads a file to a data room
   */
  async uploadFile(
    roomId: string,
    filePath: string,
    fileBuffer: Buffer,
    uploadedBy: string,
    mimeType?: string,
    options?: { downloadable?: boolean; viewOnly?: boolean },
    onProgress?: (progress: FileTransferProgress) => void
  ): Promise<DataRoomFile> {
    const dataRoom = this.dataRooms.get(roomId);
    if (!dataRoom) {
      throw new Error(`Data room not found: ${roomId}`);
    }

    const drive = this.drives.get(dataRoom.driveKey);
    if (!drive) {
      throw new Error(`Drive not found for room: ${roomId}`);
    }

    // Check write permissions
    if (!dataRoom.permissions.canWrite.includes(uploadedBy) && 
        !dataRoom.permissions.isPublic) {
      throw new Error('No write permission for this data room');
    }

    log.info(`Uploading file: ${filePath} to room: ${roomId}`);

    const fileName = path.basename(filePath);
    const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;

    // Calculate checksum
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Write file to drive
    await drive.put(normalizedPath, fileBuffer);

    // Store file metadata (downloadable/viewOnly)
    const downloadable = options?.downloadable ?? true;
    const viewOnly = options?.viewOnly ?? false;
    
    if (!this.fileMetadata.has(roomId)) {
      this.fileMetadata.set(roomId, new Map());
    }
    this.fileMetadata.get(roomId)!.set(normalizedPath, { downloadable, viewOnly });
    this.saveFileMetadata();

    // Create file metadata
    const fileMetadata: DataRoomFile = {
      path: normalizedPath,
      name: fileName,
      size: fileBuffer.length,
      mimeType: mimeType || 'application/octet-stream',
      uploadedBy,
      uploadedAt: new Date(),
      checksum,
      isDirectory: false,
      downloadable,
      viewOnly,
      viewCount: 0,
      downloadCount: 0
    };

    // Update room stats
    dataRoom.fileCount++;
    dataRoom.totalSize += fileBuffer.length;
    dataRoom.lastModified = new Date();

    // Notify progress
    if (onProgress) {
      onProgress({
        fileId: checksum,
        path: normalizedPath,
        totalBytes: fileBuffer.length,
        transferredBytes: fileBuffer.length,
        percentage: 100,
        speed: 0,
        eta: 0,
        status: 'completed'
      });
    }

    log.info(`File uploaded: ${normalizedPath} (${fileBuffer.length} bytes)`);

    return fileMetadata;
  }

  /**
   * Downloads a file from a data room
   */
  async downloadFile(
    roomId: string,
    filePath: string,
    downloadedBy: string,
    onProgress?: (progress: FileTransferProgress) => void
  ): Promise<Buffer> {
    const dataRoom = this.dataRooms.get(roomId);
    if (!dataRoom) {
      throw new Error(`Data room not found: ${roomId}`);
    }

    const drive = this.drives.get(dataRoom.driveKey);
    if (!drive) {
      throw new Error(`Drive not found for room: ${roomId}`);
    }

    // Check read permissions
    if (!dataRoom.permissions.canRead.includes(downloadedBy) && 
        !dataRoom.permissions.isPublic) {
      throw new Error('No read permission for this data room');
    }

    log.info(`Downloading file: ${filePath} from room: ${roomId}`);

    const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;

    // Read file from drive (sparse replication - only downloads needed chunks)
    const fileBuffer = await drive.get(normalizedPath);

    if (!fileBuffer) {
      throw new Error(`File not found: ${normalizedPath}`);
    }

    // Notify progress
    if (onProgress) {
      onProgress({
        fileId: crypto.createHash('sha256').update(fileBuffer).digest('hex'),
        path: normalizedPath,
        totalBytes: fileBuffer.length,
        transferredBytes: fileBuffer.length,
        percentage: 100,
        speed: 0,
        eta: 0,
        status: 'completed'
      });
    }

    log.info(`File downloaded: ${normalizedPath} (${fileBuffer.length} bytes)`);

    return fileBuffer;
  }

  /**
   * Lists files in a data room
   */
  async listFiles(roomId: string, directoryPath = '/'): Promise<DataRoomFile[]> {
    const dataRoom = this.dataRooms.get(roomId);
    if (!dataRoom) {
      throw new Error(`Data room not found: ${roomId}`);
    }

    const drive = this.drives.get(dataRoom.driveKey);
    if (!drive) {
      throw new Error(`Drive not found for room: ${roomId}`);
    }

    const files: DataRoomFile[] = [];

    // List entries in directory
    for await (const entry of drive.readdir(directoryPath)) {
      const entryPath = path.join(directoryPath, entry);
      
      // Skip internal metadata
      if (entryPath.startsWith('/.pigeon')) continue;

      const stat = await drive.entry(entryPath);
      
      if (stat) {
        // Get file metadata
        const meta = this.fileMetadata.get(roomId)?.get(entryPath) || { downloadable: true, viewOnly: false };
        // Get file stats
        const stats = this.fileStats.get(roomId)?.get(entryPath);
        
        files.push({
          path: entryPath,
          name: entry,
          size: stat.value?.blob?.byteLength || 0,
          mimeType: 'application/octet-stream',
          uploadedBy: 'unknown',
          uploadedAt: new Date(),
          checksum: '',
          isDirectory: false,
          downloadable: meta.downloadable,
          viewOnly: meta.viewOnly,
          viewCount: stats?.viewCount || 0,
          downloadCount: stats?.downloadCount || 0
        });
      }
    }

    return files;
  }

  /**
   * Deletes a file from a data room
   */
  async deleteFile(roomId: string, filePath: string, deletedBy: string): Promise<void> {
    const dataRoom = this.dataRooms.get(roomId);
    if (!dataRoom) {
      throw new Error(`Data room not found: ${roomId}`);
    }

    const drive = this.drives.get(dataRoom.driveKey);
    if (!drive) {
      throw new Error(`Drive not found for room: ${roomId}`);
    }

    // Check delete permissions
    if (!dataRoom.permissions.canDelete.includes(deletedBy) && 
        dataRoom.owner !== deletedBy) {
      throw new Error('No delete permission for this data room');
    }

    log.info(`Deleting file: ${filePath} from room: ${roomId}`);

    const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    await drive.del(normalizedPath);

    dataRoom.fileCount = Math.max(0, dataRoom.fileCount - 1);
    dataRoom.lastModified = new Date();

    log.info(`File deleted: ${normalizedPath}`);
  }

  // ============ STATS TRACKING METHODS ============

  /**
   * Track a file view
   */
  trackFileView(roomId: string, filePath: string, userId: string, userName?: string): void {
    const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    
    if (!this.fileStats.has(roomId)) {
      this.fileStats.set(roomId, new Map());
    }
    
    const roomStats = this.fileStats.get(roomId)!;
    if (!roomStats.has(normalizedPath)) {
      roomStats.set(normalizedPath, {
        viewCount: 0,
        downloadCount: 0,
        userStats: new Map()
      });
    }
    
    const stats = roomStats.get(normalizedPath)!;
    stats.viewCount++;
    
    // Track per-user stats
    if (!stats.userStats.has(userId)) {
      stats.userStats.set(userId, {
        userId,
        userName,
        viewCount: 0,
        downloadCount: 0
      });
    }
    const userStat = stats.userStats.get(userId)!;
    userStat.viewCount++;
    userStat.lastViewedAt = new Date();
    if (userName) userStat.userName = userName;
    
    this.saveFileStats();
    log.info(`File view tracked: ${normalizedPath} by ${userId}`);
  }

  /**
   * Track a file download
   */
  trackFileDownload(roomId: string, filePath: string, userId: string, userName?: string): void {
    const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    
    if (!this.fileStats.has(roomId)) {
      this.fileStats.set(roomId, new Map());
    }
    
    const roomStats = this.fileStats.get(roomId)!;
    if (!roomStats.has(normalizedPath)) {
      roomStats.set(normalizedPath, {
        viewCount: 0,
        downloadCount: 0,
        userStats: new Map()
      });
    }
    
    const stats = roomStats.get(normalizedPath)!;
    stats.downloadCount++;
    
    // Track per-user stats
    if (!stats.userStats.has(userId)) {
      stats.userStats.set(userId, {
        userId,
        userName,
        viewCount: 0,
        downloadCount: 0
      });
    }
    const userStat = stats.userStats.get(userId)!;
    userStat.downloadCount++;
    userStat.lastDownloadedAt = new Date();
    if (userName) userStat.userName = userName;
    
    this.saveFileStats();
    log.info(`File download tracked: ${normalizedPath} by ${userId}`);
  }

  /**
   * Get stats for a specific file (owner only)
   */
  getFileStats(roomId: string, filePath: string, requesterId: string): FileStats | null {
    const room = this.dataRooms.get(roomId);
    if (!room || room.owner !== requesterId) {
      return null; // Only owner can view stats
    }
    
    const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    const stats = this.fileStats.get(roomId)?.get(normalizedPath);
    
    if (!stats) {
      return {
        fileId: normalizedPath,
        fileName: path.basename(normalizedPath),
        filePath: normalizedPath,
        totalViews: 0,
        totalDownloads: 0,
        userStats: room.ndaText ? [] : undefined // Include user stats only for NDA rooms
      };
    }
    
    return {
      fileId: normalizedPath,
      fileName: path.basename(normalizedPath),
      filePath: normalizedPath,
      totalViews: stats.viewCount,
      totalDownloads: stats.downloadCount,
      userStats: room.ndaText ? Array.from(stats.userStats.values()) : undefined
    };
  }

  /**
   * Get stats for all files in a room (owner only)
   */
  getRoomFileStats(roomId: string, requesterId: string): FileStats[] {
    const room = this.dataRooms.get(roomId);
    if (!room || room.owner !== requesterId) {
      return []; // Only owner can view stats
    }
    
    const result: FileStats[] = [];
    const roomStats = this.fileStats.get(roomId);
    
    if (roomStats) {
      for (const [filePath, stats] of roomStats) {
        result.push({
          fileId: filePath,
          fileName: path.basename(filePath),
          filePath,
          totalViews: stats.viewCount,
          totalDownloads: stats.downloadCount,
          userStats: room.ndaText ? Array.from(stats.userStats.values()) : undefined
        });
      }
    }
    
    return result;
  }

  /**
   * Check if file is downloadable
   */
  isFileDownloadable(roomId: string, filePath: string): boolean {
    const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    const meta = this.fileMetadata.get(roomId)?.get(normalizedPath);
    return meta?.downloadable ?? true;
  }

  /**
   * Gets a data room by ID
   */
  getDataRoom(roomId: string): DataRoom | undefined {
    return this.dataRooms.get(roomId);
  }

  /**
   * Gets all data rooms
   */
  getAllDataRooms(): DataRoom[] {
    return Array.from(this.dataRooms.values());
  }

  /**
   * Leaves a data room
   */
  async leaveDataRoom(roomId: string): Promise<void> {
    const dataRoom = this.dataRooms.get(roomId);
    if (!dataRoom) return;

    const drive = this.drives.get(dataRoom.driveKey);
    if (drive && this.swarm) {
      // Leave swarm for this drive
      await this.swarm.leave(drive.discoveryKey);
      await drive.close();
    }

    this.drives.delete(dataRoom.driveKey);
    this.dataRooms.delete(roomId);

    log.info(`Left data room: ${roomId}`);
  }

  // ============ ACCESS CONTROL METHODS ============

  /**
   * Check if user has file access to a room
   */
  hasFileAccess(roomId: string, userId: string): boolean {
    const room = this.dataRooms.get(roomId);
    if (!room) return false;
    
    if (room.accessType === DataRoomAccessType.OPEN) return true;
    return room.participants.includes(userId) || room.owner === userId;
  }

  /**
   * Get user's access status for a room
   */
  getUserAccessStatus(roomId: string, userId: string): 'owner' | 'approved' | 'pending' | 'none' {
    const room = this.dataRooms.get(roomId);
    if (!room) return 'none';
    
    if (room.owner === userId) return 'owner';
    if (room.participants.includes(userId)) return 'approved';
    
    const pendingRequest = room.accessRequests?.find(
      r => r.userId === userId && r.status === AccessRequestStatus.PENDING
    );
    if (pendingRequest) return 'pending';
    
    return 'none';
  }

  /**
   * Request access to a closed room
   */
  async requestAccess(
    roomId: string,
    userId: string,
    options: { userName?: string; email?: string; message?: string; agreedToTerms: boolean }
  ): Promise<AccessRequest> {
    const room = this.dataRooms.get(roomId);
    if (!room) {
      throw new Error(`Data room not found: ${roomId}`);
    }

    if (room.participants.includes(userId)) {
      throw new Error('User already has access to this room');
    }

    const existingRequest = room.accessRequests?.find(
      r => r.userId === userId && r.status === AccessRequestStatus.PENDING
    );
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

    if (!room.accessRequests) room.accessRequests = [];
    room.accessRequests.push(request);
    this.saveRooms();

    log.info(`Access request from ${userId} for room ${roomId}`);
    return request;
  }

  /**
   * Approve access request
   */
  async approveAccess(roomId: string, requestId: string, reviewerId: string): Promise<AccessRequest> {
    const room = this.dataRooms.get(roomId);
    if (!room) {
      throw new Error(`Data room not found: ${roomId}`);
    }

    if (room.owner !== reviewerId) {
      throw new Error('Only room owner can approve access requests');
    }

    const request = room.accessRequests?.find(r => r.id === requestId);
    if (!request) {
      throw new Error('Access request not found');
    }

    request.status = AccessRequestStatus.APPROVED;
    request.reviewedAt = new Date();
    request.reviewedBy = reviewerId;

    if (!room.participants.includes(request.userId)) {
      room.participants.push(request.userId);
    }

    this.saveRooms();
    log.info(`Access approved for ${request.userId} to room ${roomId}`);
    return request;
  }

  /**
   * Reject access request
   */
  async rejectAccess(roomId: string, requestId: string, reviewerId: string): Promise<AccessRequest> {
    const room = this.dataRooms.get(roomId);
    if (!room) {
      throw new Error(`Data room not found: ${roomId}`);
    }

    if (room.owner !== reviewerId) {
      throw new Error('Only room owner can reject access requests');
    }

    const request = room.accessRequests?.find(r => r.id === requestId);
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

  /**
   * Remove user access
   */
  async removeAccess(roomId: string, userId: string, removerId: string): Promise<void> {
    const room = this.dataRooms.get(roomId);
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
    if (room.connectedUsers) {
      room.connectedUsers = room.connectedUsers.filter(u => u !== userId);
    }

    this.saveRooms();
    log.info(`Access removed for ${userId} from room ${roomId}`);
  }

  /**
   * Connect user to room
   */
  connectUser(roomId: string, userId: string): void {
    const room = this.dataRooms.get(roomId);
    if (!room) return;

    if (!room.connectedUsers) room.connectedUsers = [];
    if (!room.connectedUsers.includes(userId)) {
      room.connectedUsers.push(userId);
      this.saveRooms();
    }
  }

  /**
   * Disconnect user from room
   */
  disconnectUser(roomId: string, userId: string): void {
    const room = this.dataRooms.get(roomId);
    if (!room) return;

    if (room.connectedUsers) {
      room.connectedUsers = room.connectedUsers.filter(u => u !== userId);
      this.saveRooms();
    }
  }

  /**
   * Get pending access requests for a room
   */
  getPendingRequests(roomId: string): AccessRequest[] {
    const room = this.dataRooms.get(roomId);
    if (!room || !room.accessRequests) return [];
    return room.accessRequests.filter(r => r.status === AccessRequestStatus.PENDING);
  }

  /**
   * Shuts down the Hyperdrive manager
   */
  async shutdown(): Promise<void> {
    log.info('Shutting down Hyperdrive Manager...');

    // Close all drives
    for (const [key, drive] of this.drives) {
      await drive.close();
    }
    this.drives.clear();

    // Destroy swarm
    if (this.swarm) {
      await this.swarm.destroy();
      this.swarm = null;
    }

    // Close corestore
    if (this.corestore) {
      await this.corestore.close();
      this.corestore = null;
    }

    this.isInitialized = false;
    log.info('Hyperdrive Manager shut down');
  }
}

export default HyperdriveManager;
