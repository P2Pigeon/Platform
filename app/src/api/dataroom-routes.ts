/**
 * Data Room API Routes
 * 
 * Exposes Hyperdrive-based data room operations via REST API
 * for browser clients that can't use native Hyperswarm.
 * 
 * TRUE P2P IMPLEMENTATION:
 * - Files are stored in Hyperdrive (append-only log with sparse replication)
 * - Data persists as long as any peer with the data is online
 * - No central server storage - data lives on peer devices
 * - Storage limit = combined storage of all connected peers
 */
import express, { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { HyperdriveManager, DataRoomAccessType } from '../dataroom/HyperdriveManager';
import Logs from '../logs';

const log = new Logs('dataroom-api');

// Configure multer for file uploads - no hard limit since P2P storage is device-based
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 } // 1GB max per file (limited by device storage)
});

// Initialize Hyperdrive Manager for true P2P file sharing
const hyperdriveManager = new HyperdriveManager({
  storagePath: path.join(process.cwd(), '.hyperdrive-storage')
});

// Track initialization
let isInitialized = false;
let initPromise: Promise<void> | null = null;

// Export function to pre-initialize at server startup
export async function initializeDataRoomService(): Promise<void> {
  if (isInitialized) return;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    log.info('Pre-initializing Hyperdrive Manager at server startup...');
    await hyperdriveManager.initialize();
    isInitialized = true;
    log.info('Hyperdrive Manager initialized - P2P file sharing ready');
  })();
  
  return initPromise;
}

async function ensureInitialized(): Promise<void> {
  if (isInitialized) return;
  if (initPromise) return initPromise;
  return initializeDataRoomService();
}

const router: Router = express.Router();

/**
 * Create a new data room
 * POST /api/v1/dataroom
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    await ensureInitialized();
    
    const { name, description, accessType, ndaText } = req.body;
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    
    if (!name) {
      return res.status(400).json({ error: 'Room name is required' });
    }
    
    const room = await hyperdriveManager.createDataRoom(name, userId, {
      description,
      accessType: accessType === 'closed' ? DataRoomAccessType.CLOSED : DataRoomAccessType.OPEN,
      ndaText
    });
    
    log.info(`Data room created: ${room.id} (${room.accessType})`);
    
    res.status(201).json({
      success: true,
      room: {
        id: room.id,
        name: room.name,
        description: room.description,
        owner: room.owner,
        createdAt: room.createdAt,
        accessType: room.accessType,
        ndaText: room.ndaText
      }
    });
  } catch (error) {
    log.error('Failed to create data room:', error);
    res.status(500).json({ 
      error: 'Failed to create data room',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Join an existing data room by drive key
 * POST /api/v1/dataroom/join
 */
router.post('/join', async (req: Request, res: Response) => {
  try {
    await ensureInitialized();
    
    const { driveKey } = req.body;
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    
    if (!driveKey) {
      return res.status(400).json({ error: 'Drive key is required' });
    }
    
    const room = await hyperdriveManager.joinDataRoom(driveKey, userId);
    
    log.info(`User ${userId} joined data room: ${room.id}`);
    
    res.status(200).json({
      success: true,
      room: {
        id: room.id,
        name: room.name,
        description: room.description,
        owner: room.owner,
        participants: room.participants,
        fileCount: room.fileCount
      }
    });
  } catch (error) {
    log.error('Failed to join data room:', error);
    res.status(500).json({ 
      error: 'Failed to join data room',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * List files in a data room
 * GET /api/v1/dataroom/:roomId/files
 */
router.get('/:roomId/files', async (req: Request, res: Response) => {
  try {
    await ensureInitialized();
    
    const { roomId } = req.params;
    const files = await hyperdriveManager.listFiles(roomId);
    
    res.status(200).json({
      success: true,
      files
    });
  } catch (error) {
    log.error('Failed to list files:', error);
    res.status(500).json({ 
      error: 'Failed to list files',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Upload a file to a data room
 * POST /api/v1/dataroom/:roomId/files
 */
router.post('/:roomId/files', upload.single('file'), async (req: Request, res: Response) => {
  try {
    await ensureInitialized();
    
    const { roomId } = req.params;
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    const fileInfo = await hyperdriveManager.uploadFile(
      roomId,
      file.originalname,
      file.buffer,
      userId,
      file.mimetype
    );
    
    log.info(`File uploaded to room ${roomId}: ${file.originalname}`);
    
    res.status(201).json({
      success: true,
      file: fileInfo
    });
  } catch (error) {
    log.error('Failed to upload file:', error);
    res.status(500).json({ 
      error: 'Failed to upload file',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Download a file from a data room
 * GET /api/v1/dataroom/:roomId/files/:filePath
 */
router.get('/:roomId/files/*', async (req: Request, res: Response) => {
  try {
    await ensureInitialized();
    
    const { roomId } = req.params;
    const filePath = req.params[0]; // Everything after /files/
    
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    const data = await hyperdriveManager.downloadFile(roomId, `/${filePath}`, userId);
    const fileName = path.basename(filePath);
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(data);
  } catch (error) {
    log.error('Failed to download file:', error);
    res.status(500).json({ 
      error: 'Failed to download file',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Delete a file from a data room
 * DELETE /api/v1/dataroom/:roomId/files/:filePath
 */
router.delete('/:roomId/files/*', async (req: Request, res: Response) => {
  try {
    await ensureInitialized();
    
    const { roomId } = req.params;
    const filePath = req.params[0];
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    
    await hyperdriveManager.deleteFile(roomId, `/${filePath}`, userId);
    
    log.info(`File deleted from room ${roomId}: ${filePath}`);
    
    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    log.error('Failed to delete file:', error);
    res.status(500).json({ 
      error: 'Failed to delete file',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get room info
 * GET /api/v1/dataroom/:roomId
 */
router.get('/:roomId', async (req: Request, res: Response) => {
  try {
    await ensureInitialized();
    
    const { roomId } = req.params;
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    const room = hyperdriveManager.getDataRoom(roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Get user's access status
    const accessStatus = hyperdriveManager.getUserAccessStatus(roomId, userId);
    const hasFileAccess = hyperdriveManager.hasFileAccess(roomId, userId);
    
    res.status(200).json({
      success: true,
      room,
      accessStatus,
      hasFileAccess
    });
  } catch (error) {
    log.error('Failed to get room:', error);
    res.status(500).json({ 
      error: 'Failed to get room',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Request access to a closed data room
 * POST /api/v1/dataroom/:roomId/access/request
 */
router.post('/:roomId/access/request', async (req: Request, res: Response) => {
  try {
    await ensureInitialized();
    
    const { roomId } = req.params;
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    const { userName, email, message, agreedToTerms } = req.body;
    
    const request = await hyperdriveManager.requestAccess(roomId, userId, {
      userName,
      email,
      message,
      agreedToTerms: agreedToTerms ?? false
    });
    
    log.info(`Access request submitted for room ${roomId} by ${userId}`);
    
    res.status(201).json({
      success: true,
      request
    });
  } catch (error) {
    log.error('Failed to request access:', error);
    res.status(500).json({ 
      error: 'Failed to request access',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get pending access requests for a room (owner only)
 * GET /api/v1/dataroom/:roomId/access/requests
 */
router.get('/:roomId/access/requests', async (req: Request, res: Response) => {
  try {
    await ensureInitialized();
    
    const { roomId } = req.params;
    const requests = hyperdriveManager.getPendingRequests(roomId);
    
    res.status(200).json({
      success: true,
      requests
    });
  } catch (error) {
    log.error('Failed to get access requests:', error);
    res.status(500).json({ 
      error: 'Failed to get access requests',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Approve access request (owner only)
 * POST /api/v1/dataroom/:roomId/access/approve/:requestId
 */
router.post('/:roomId/access/approve/:requestId', async (req: Request, res: Response) => {
  try {
    await ensureInitialized();
    
    const { roomId, requestId } = req.params;
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    
    const request = await hyperdriveManager.approveAccess(roomId, requestId, userId);
    
    log.info(`Access approved for request ${requestId} in room ${roomId}`);
    
    res.status(200).json({
      success: true,
      request
    });
  } catch (error) {
    log.error('Failed to approve access:', error);
    res.status(500).json({ 
      error: 'Failed to approve access',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Reject access request (owner only)
 * POST /api/v1/dataroom/:roomId/access/reject/:requestId
 */
router.post('/:roomId/access/reject/:requestId', async (req: Request, res: Response) => {
  try {
    await ensureInitialized();
    
    const { roomId, requestId } = req.params;
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    
    const request = await hyperdriveManager.rejectAccess(roomId, requestId, userId);
    
    log.info(`Access rejected for request ${requestId} in room ${roomId}`);
    
    res.status(200).json({
      success: true,
      request
    });
  } catch (error) {
    log.error('Failed to reject access:', error);
    res.status(500).json({ 
      error: 'Failed to reject access',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Remove user access (owner only)
 * DELETE /api/v1/dataroom/:roomId/access/:userId
 */
router.delete('/:roomId/access/:targetUserId', async (req: Request, res: Response) => {
  try {
    await ensureInitialized();
    
    const { roomId, targetUserId } = req.params;
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    
    await hyperdriveManager.removeAccess(roomId, targetUserId, userId);
    
    log.info(`Access removed for user ${targetUserId} from room ${roomId}`);
    
    res.status(200).json({
      success: true,
      message: 'Access removed successfully'
    });
  } catch (error) {
    log.error('Failed to remove access:', error);
    res.status(500).json({ 
      error: 'Failed to remove access',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Connect user to room (for tracking connected users)
 * POST /api/v1/dataroom/:roomId/connect
 */
router.post('/:roomId/connect', async (req: Request, res: Response) => {
  try {
    await ensureInitialized();
    
    const { roomId } = req.params;
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    
    hyperdriveManager.connectUser(roomId, userId);
    
    res.status(200).json({
      success: true,
      message: 'Connected to room'
    });
  } catch (error) {
    log.error('Failed to connect to room:', error);
    res.status(500).json({ 
      error: 'Failed to connect to room',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Disconnect user from room
 * POST /api/v1/dataroom/:roomId/disconnect
 */
router.post('/:roomId/disconnect', async (req: Request, res: Response) => {
  try {
    await ensureInitialized();
    
    const { roomId } = req.params;
    const userId = req.headers['x-user-id'] as string || 'anonymous';
    
    hyperdriveManager.disconnectUser(roomId, userId);
    
    res.status(200).json({
      success: true,
      message: 'Disconnected from room'
    });
  } catch (error) {
    log.error('Failed to disconnect from room:', error);
    res.status(500).json({ 
      error: 'Failed to disconnect from room',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get DHT connection status
 * GET /api/v1/dataroom/dht/status
 */
router.get('/dht/status', async (req: Request, res: Response) => {
  try {
    await ensureInitialized();
    
    const status = hyperdriveManager.getDHTStatus();
    
    res.status(200).json({
      success: true,
      status
    });
  } catch (error) {
    log.error('Failed to get DHT status:', error);
    res.status(500).json({ 
      error: 'Failed to get DHT status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Force re-announce all drives to DHT
 * POST /api/v1/dataroom/dht/reannounce
 */
router.post('/dht/reannounce', async (req: Request, res: Response) => {
  try {
    await ensureInitialized();
    
    await hyperdriveManager.forceReannounceAll();
    
    res.status(200).json({
      success: true,
      message: 'Re-announcement initiated for all drives'
    });
  } catch (error) {
    log.error('Failed to re-announce drives:', error);
    res.status(500).json({ 
      error: 'Failed to re-announce drives',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
