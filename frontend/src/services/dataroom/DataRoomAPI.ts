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
 * Data Room API Client
 * 
 * Frontend service for interacting with the Hyperdrive-based data room backend.
 * Handles room creation, file upload/download, and room management.
 */

// Access type for data rooms
export type DataRoomAccessType = 'open' | 'closed';

// Access request status
export type AccessRequestStatus = 'pending' | 'approved' | 'rejected';

// Access request from a user
export interface AccessRequest {
  id: string;
  userId: string;
  userName?: string;
  email?: string;
  message?: string;
  agreedToTerms: boolean;
  status: AccessRequestStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface DataRoom {
  id: string;
  name: string;
  description?: string;
  owner: string;
  participants?: string[];
  createdAt: string;
  fileCount?: number;
  totalSize?: number;
  // Access control
  accessType?: DataRoomAccessType;
  ndaText?: string;
  accessRequests?: AccessRequest[];
  connectedUsers?: string[];
}

// User's access status for a room
export type UserAccessStatus = 'owner' | 'approved' | 'pending' | 'none';

// Extended room response with access info
export interface DataRoomResponse {
  room: DataRoom;
  accessStatus: UserAccessStatus;
  hasFileAccess: boolean;
}

export interface DataRoomFile {
  id: string;
  path: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
  checksum: string;
  // Media viewer settings
  downloadable: boolean;
  viewOnly: boolean;
  // Stats (visible to owner only)
  viewCount?: number;
  downloadCount?: number;
}

// Per-user view stats for NDA rooms
export interface FileUserStat {
  userId: string;
  userName?: string;
  viewCount: number;
  downloadCount: number;
  lastViewedAt?: string;
  lastDownloadedAt?: string;
}

// File stats response
export interface FileStats {
  fileId: string;
  fileName: string;
  totalViews: number;
  totalDownloads: number;
  userStats?: FileUserStat[]; // Only for NDA rooms
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:3060/api/v1/dataroom' 
  : '/api/v1/dataroom';

/**
 * Create a new data room
 */
export async function createDataRoom(
  name: string,
  options?: { 
    description?: string; 
    accessType?: DataRoomAccessType;
    ndaText?: string;
  }
): Promise<DataRoom> {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId()
      },
      body: JSON.stringify({ name, ...options })
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create data room';
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.room;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Please ensure the backend is running on port 3060.');
    }
    throw error;
  }
}

/**
 * Join an existing data room by ID
 */
export async function joinDataRoom(roomId: string): Promise<DataRoom> {
  try {
    const response = await fetch(`${API_BASE}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': getUserId()
      },
      body: JSON.stringify({ driveKey: roomId })
    });

    if (!response.ok) {
      let errorMessage = 'Failed to join data room';
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.room;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Please ensure the backend is running on port 3060.');
    }
    throw error;
  }
}

/**
 * Get data room info (returns just the room)
 */
export async function getDataRoom(roomId: string): Promise<DataRoom | null> {
  const response = await fetch(`${API_BASE}/${roomId}`, {
    headers: {
      'x-user-id': getUserId()
    }
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get data room');
  }

  const data = await response.json();
  return data.room;
}

/**
 * Get data room info with access status
 */
export async function getDataRoomWithAccess(roomId: string): Promise<DataRoomResponse | null> {
  const response = await fetch(`${API_BASE}/${roomId}`, {
    headers: {
      'x-user-id': getUserId()
    }
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get data room');
  }

  const data = await response.json();
  return {
    room: data.room,
    accessStatus: data.accessStatus || 'none',
    hasFileAccess: data.hasFileAccess ?? true
  };
}

/**
 * List files in a data room
 */
export async function listFiles(roomId: string): Promise<DataRoomFile[]> {
  const response = await fetch(`${API_BASE}/${roomId}/files`, {
    headers: {
      'x-user-id': getUserId()
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to list files');
  }

  const data = await response.json();
  return data.files;
}

/**
 * Upload a file to a data room
 */
export async function uploadFile(
  roomId: string,
  file: File,
  options?: { downloadable?: boolean; viewOnly?: boolean },
  onProgress?: (progress: UploadProgress) => void
): Promise<DataRoomFile> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('downloadable', String(options?.downloadable ?? true));
  formData.append('viewOnly', String(options?.viewOnly ?? false));

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100)
        });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve(data.file);
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.message || 'Failed to upload file'));
        } catch {
          reject(new Error('Failed to upload file'));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onabort = () => reject(new Error('Upload cancelled'));

    xhr.open('POST', `${API_BASE}/${roomId}/files`);
    xhr.setRequestHeader('x-user-id', getUserId());
    xhr.send(formData);
  });
}

/**
 * Download a file from a data room
 */
export async function downloadFile(
  roomId: string,
  filePath: string
): Promise<Blob> {
  const encodedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  const response = await fetch(`${API_BASE}/${roomId}/files/${encodedPath}`, {
    headers: {
      'x-user-id': getUserId()
    }
  });

  if (!response.ok) {
    throw new Error('Failed to download file');
  }

  return response.blob();
}

/**
 * Delete a file from a data room
 */
export async function deleteFile(roomId: string, filePath: string): Promise<void> {
  const encodedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  const response = await fetch(`${API_BASE}/${roomId}/files/${encodedPath}`, {
    method: 'DELETE',
    headers: {
      'x-user-id': getUserId()
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete file');
  }
}

/**
 * Get or generate a user ID for the current session
 */
function getUserId(): string {
  let userId = localStorage.getItem('pigeon-user-id');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('pigeon-user-id', userId);
  }
  return userId;
}

/**
 * Export the current user ID
 */
export function getCurrentUserId(): string {
  return getUserId();
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ============= Access Control Functions =============

/**
 * Request access to a closed data room
 */
export async function requestAccess(
  roomId: string,
  options: { userName?: string; email?: string; message?: string; agreedToTerms: boolean }
): Promise<AccessRequest> {
  const response = await fetch(`${API_BASE}/${roomId}/access/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': getUserId()
    },
    body: JSON.stringify(options)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to request access');
  }

  const data = await response.json();
  return data.request;
}

/**
 * Get pending access requests for a room (owner only)
 */
export async function getPendingRequests(roomId: string): Promise<AccessRequest[]> {
  const response = await fetch(`${API_BASE}/${roomId}/access/requests`, {
    headers: {
      'x-user-id': getUserId()
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get access requests');
  }

  const data = await response.json();
  return data.requests;
}

/**
 * Approve access request (owner only)
 */
export async function approveAccess(roomId: string, requestId: string): Promise<AccessRequest> {
  const response = await fetch(`${API_BASE}/${roomId}/access/approve/${requestId}`, {
    method: 'POST',
    headers: {
      'x-user-id': getUserId()
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to approve access');
  }

  const data = await response.json();
  return data.request;
}

/**
 * Reject access request (owner only)
 */
export async function rejectAccess(roomId: string, requestId: string): Promise<AccessRequest> {
  const response = await fetch(`${API_BASE}/${roomId}/access/reject/${requestId}`, {
    method: 'POST',
    headers: {
      'x-user-id': getUserId()
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to reject access');
  }

  const data = await response.json();
  return data.request;
}

/**
 * Remove user access (owner only)
 */
export async function removeUserAccess(roomId: string, userId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${roomId}/access/${userId}`, {
    method: 'DELETE',
    headers: {
      'x-user-id': getUserId()
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to remove user access');
  }
}

/**
 * Connect to a room (track as connected user)
 */
export async function connectToRoom(roomId: string): Promise<void> {
  await fetch(`${API_BASE}/${roomId}/connect`, {
    method: 'POST',
    headers: {
      'x-user-id': getUserId()
    }
  });
}

/**
 * Disconnect from a room
 */
export async function disconnectFromRoom(roomId: string): Promise<void> {
  await fetch(`${API_BASE}/${roomId}/disconnect`, {
    method: 'POST',
    headers: {
      'x-user-id': getUserId()
    }
  });
}

/**
 * Track file view (for stats)
 */
export async function trackFileView(roomId: string, filePath: string): Promise<void> {
  const encodedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  await fetch(`${API_BASE}/${roomId}/files/${encodedPath}/view`, {
    method: 'POST',
    headers: {
      'x-user-id': getUserId()
    }
  });
}

/**
 * Track file download (for stats)
 */
export async function trackFileDownload(roomId: string, filePath: string): Promise<void> {
  const encodedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  await fetch(`${API_BASE}/${roomId}/files/${encodedPath}/download`, {
    method: 'POST',
    headers: {
      'x-user-id': getUserId()
    }
  });
}

/**
 * Get file stats (owner only)
 */
export async function getFileStats(roomId: string, filePath: string): Promise<FileStats> {
  const encodedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  const response = await fetch(`${API_BASE}/${roomId}/files/${encodedPath}/stats`, {
    headers: {
      'x-user-id': getUserId()
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get file stats');
  }

  return response.json();
}

/**
 * Get all files stats for a room (owner only)
 */
export async function getRoomFileStats(roomId: string): Promise<FileStats[]> {
  const response = await fetch(`${API_BASE}/${roomId}/stats`, {
    headers: {
      'x-user-id': getUserId()
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get room stats');
  }

  const data = await response.json();
  return data.stats;
}

/**
 * Get file for viewing (returns URL or blob)
 */
export async function getFileForViewing(roomId: string, filePath: string): Promise<string> {
  const encodedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  
  // Track the view
  await trackFileView(roomId, filePath);
  
  const response = await fetch(`${API_BASE}/${roomId}/files/${encodedPath}`, {
    headers: {
      'x-user-id': getUserId()
    }
  });

  if (!response.ok) {
    throw new Error('Failed to get file for viewing');
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export default {
  createDataRoom,
  joinDataRoom,
  getDataRoom,
  getDataRoomWithAccess,
  listFiles,
  uploadFile,
  downloadFile,
  deleteFile,
  formatFileSize,
  getCurrentUserId,
  requestAccess,
  getPendingRequests,
  approveAccess,
  rejectAccess,
  removeUserAccess,
  connectToRoom,
  disconnectFromRoom,
  trackFileView,
  trackFileDownload,
  getFileStats,
  getRoomFileStats,
  getFileForViewing
};
