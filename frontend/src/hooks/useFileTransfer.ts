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
 * useFileTransfer Hook
 * 
 * Custom hook for managing file transfers in data rooms. */
import { useState, useEffect, useCallback } from 'react';
import { useCommunication } from '../context/CommunicationContext';
import { FileMetadata, FileTransferProgress, RoomId, FileId } from '../types/core';

interface FileTransferState {
  files: FileMetadata[];
  transfers: Record<FileId, FileTransferProgress>;
  isLoading: boolean;
  error: Error | null;
}

export const useFileTransfer = (roomId: RoomId) => {
  const [state, setState] = useState<FileTransferState>({
    files: [],
    transfers: {},
    isLoading: false,
    error: null
  });
  
  const { 
    getAvailableFiles, 
    sendFile, 
    downloadFile,
    protocolManager 
  } = useCommunication();

  // Load available files in the room
  const loadFiles = useCallback(() => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const files = getAvailableFiles(roomId);
      setState(prev => ({ ...prev, files, isLoading: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error : new Error('Failed to load files') 
      }));
    }
  }, [roomId, getAvailableFiles]);

  // Send a file to the room
  const uploadFile = useCallback(async (file: File): Promise<FileId> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const fileId = await sendFile(roomId, file);
      
      // Update transfers state with initial progress
      setState(prev => ({
        ...prev,
        transfers: {
          ...prev.transfers,
          [fileId]: {
            fileId,
            senderId: '', // Will be filled by the protocol adapter
            receiverId: '', // Will be filled by the protocol adapter
            bytesTransferred: 0,
            totalBytes: file.size,
            status: 'queued',
            startTime: new Date(),
            chunksTransferred: 0,
            totalChunks: 1, // Will be updated by the protocol adapter
          }
        },
        isLoading: false
      }));
      
      return fileId;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error : new Error('Failed to upload file') 
      }));
      throw error;
    }
  }, [roomId, sendFile]);

  // Download a file from the room
  const retrieveFile = useCallback(async (fileId: FileId): Promise<Blob> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const blob = await downloadFile(fileId);
      
      setState(prev => ({
        ...prev,
        isLoading: false
      }));
      
      return blob;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error : new Error('Failed to download file') 
      }));
      throw error;
    }
  }, [downloadFile]);

  // Listen for file transfer events
  useEffect(() => {
    if (!protocolManager) return;

    const handleFileTransferProgress = (
      fileId: FileId, 
      senderId: string, 
      receiverId: string, 
      progress: number
    ) => {
      const file = state.files.find(f => f.id === fileId);
      if (!file) return;
      
      setState(prev => ({
        ...prev,
        transfers: {
          ...prev.transfers,
          [fileId]: {
            ...prev.transfers[fileId],
            fileId,
            senderId,
            receiverId,
            bytesTransferred: Math.floor(file.size * progress),
            totalBytes: file.size,
            status: 'in-progress',
          }
        }
      }));
    };

    const handleFileTransferComplete = (fileId: FileId) => {
      setState(prev => ({
        ...prev,
        transfers: {
          ...prev.transfers,
          [fileId]: {
            ...prev.transfers[fileId],
            status: 'completed',
            endTime: new Date()
          }
        }
      }));
      
      // Refresh file list
      loadFiles();
    };

    const handleFileTransferError = (fileId: FileId, error: Error) => {
      setState(prev => ({
        ...prev,
        transfers: {
          ...prev.transfers,
          [fileId]: {
            ...prev.transfers[fileId],
            status: 'error',
            error: error.message,
            endTime: new Date()
          }
        }
      }));
    };

    // Register event handlers
    protocolManager.on('onFileTransferProgress', handleFileTransferProgress);
    protocolManager.on('onFileTransferComplete', handleFileTransferComplete);
    protocolManager.on('onFileTransferError', handleFileTransferError);
    
    // Load initial files
    loadFiles();
    
    // Clean up event listeners
    return () => {
      protocolManager.off('onFileTransferProgress', handleFileTransferProgress);
      protocolManager.off('onFileTransferComplete', handleFileTransferComplete);
      protocolManager.off('onFileTransferError', handleFileTransferError);
    };
  }, [protocolManager, loadFiles, state.files]);

  return {
    files: state.files,
    transfers: state.transfers,
    isLoading: state.isLoading,
    error: state.error,
    uploadFile,
    retrieveFile,
    refreshFiles: loadFiles
  };
};

export default useFileTransfer;
