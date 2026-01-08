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
 * @file FileItem.tsx
 * @description A component that displays information about a single file in a data room, including its metadata, transfer progress, and download functionality.
 * 
 * This component is a key part of the data collaboration feature, providing a user-friendly way to interact with shared files.
 * 
 * @module Components/FileItem
 */
import React, { useState } from 'react';
import { File, FileText, Image, Video, Music, FileType, Archive, Code, Download, Loader2 } from 'lucide-react';
import { FileMetadata, FileTransferProgress } from '../types/core';

interface FileItemProps {
  file: FileMetadata;
  transfer?: FileTransferProgress;
  isCurrentUserOwner: boolean;
  onDownload: (fileId: string) => Promise<void>;
}

export const FileItem: React.FC<FileItemProps> = ({ file, transfer, isCurrentUserOwner, onDownload }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatSize = (sizeInBytes: number): string => {
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    if (sizeInBytes < 1048576) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    if (sizeInBytes < 1073741824) return `${(sizeInBytes / 1048576).toFixed(1)} MB`;
    return `${(sizeInBytes / 1073741824).toFixed(1)} GB`;
  };

  const getFileIcon = (type: string) => {
    const className = "w-5 h-5";
    if (type.startsWith('image/')) return <Image className={className} />;
    if (type.startsWith('video/')) return <Video className={className} />;
    if (type.startsWith('audio/')) return <Music className={className} />;
    if (type === 'application/pdf') return <FileType className={className} />;
    if (type.includes('zip') || type.includes('tar') || type.includes('rar')) return <Archive className={className} />;
    if (type.includes('text/') || type.includes('application/json') || type.includes('javascript')) return <Code className={className} />;
    if (type.includes('document') || type.includes('sheet')) return <FileText className={className} />;
    return <File className={className} />;
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setError(null);
      await onDownload(file.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not download file');
    } finally {
      setIsDownloading(false);
    }
  };

  const progress = transfer ? Math.round((transfer.bytesTransferred / transfer.totalBytes) * 100) : 0;
  const isTransferActive = transfer && ['queued', 'in-progress'].includes(transfer.status);
  const hasError = transfer && transfer.status === 'error';

  return (
    <div className="p-3 border border-gray-700 rounded-md bg-gray-800 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-gray-400">{getFileIcon(file.type)}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-white">{file.name}</p>
          <div className="flex justify-between text-sm text-gray-500">
            <span>{formatSize(file.size)}</span>
            {isCurrentUserOwner ? (
              <span className="px-2 text-xs rounded bg-green-500/20 text-green-400">Your File</span>
            ) : (
              <span className="text-xs">{new Date(file.lastModified).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>

      {isTransferActive && (
        <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2 overflow-hidden">
          <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      
      {(hasError || error) && (
        <p className="text-red-500 text-sm mb-2">Error: {transfer?.error || error || 'Transfer failed'}</p>
      )}

      <div className="text-right">
        {!isCurrentUserOwner && (
          <button
            title={isTransferActive ? 'Download in progress' : 'Download file'}
            onClick={handleDownload}
            disabled={isDownloading || isTransferActive}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-cyan-500 text-cyan-400 rounded hover:bg-cyan-500/10 disabled:opacity-50"
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isDownloading ? 'Downloading' : 'Download'}
          </button>
        )}
      </div>
    </div>
  );
};

export default FileItem;
