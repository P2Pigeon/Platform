/**
 * P2Pigeon - Secure P2P Communication Platform
 * 
 * @license AGPL-3.0 - https://opensource.org/licenses/AGPL-3.0
 * @copyright 2024-2026 P2Pigeon Contributors
 * @see https://github.com/p2pigeon/platform
 */

import React, { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2, FileText, Image as ImageIcon, Film, Music, File, Loader2, Eye, EyeOff } from 'lucide-react';
import { DataRoomFile, getFileForViewing, downloadFile, trackFileDownload, formatFileSize } from '../../services/dataroom/DataRoomAPI';

interface MediaViewerProps {
  file: DataRoomFile;
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
}

const MediaViewer: React.FC<MediaViewerProps> = ({ file, roomId, isOpen, onClose, onDownload }) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Determine file type
  const getFileType = (mimeType: string, name: string): 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'other' => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.json')) return 'text';
    return 'other';
  };

  const fileType = getFileType(file.mimeType, file.name);

  // Load file for viewing
  useEffect(() => {
    if (!isOpen) return;

    const loadFile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const url = await getFileForViewing(roomId, file.path);
        setFileUrl(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load file');
      } finally {
        setIsLoading(false);
      }
    };

    loadFile();

    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [isOpen, roomId, file.path]);

  // Handle download
  const handleDownload = async () => {
    if (!file.downloadable && file.viewOnly) {
      return; // Can't download view-only files
    }

    try {
      await trackFileDownload(roomId, file.path);
      const blob = await downloadFile(roomId, file.path);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      onDownload?.();
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      setZoom(1);
      setRotation(0);
    }
  };

  if (!isOpen) return null;

  // Get icon for file type
  const FileIcon = {
    image: ImageIcon,
    video: Film,
    audio: Music,
    pdf: FileText,
    text: FileText,
    other: File
  }[fileType];

  return (
    <div 
      className={`fixed inset-0 bg-black/90 z-50 flex flex-col ${isFullscreen ? '' : 'p-4 md:p-8'}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <FileIcon className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-white font-medium truncate max-w-[300px]">{file.name}</h3>
            <p className="text-sm text-gray-400">{formatFileSize(file.size)} • {file.mimeType}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View-only indicator */}
          {file.viewOnly && !file.downloadable && (
            <div className="flex items-center gap-1 px-2 py-1 bg-orange-600/30 text-orange-400 text-xs rounded">
              <EyeOff className="w-3 h-3" />
              View Only
            </div>
          )}
          
          {/* Zoom controls for images */}
          {fileType === 'image' && (
            <>
              <button onClick={handleZoomOut} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                <ZoomOut className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={handleZoomIn} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                <ZoomIn className="w-5 h-5" />
              </button>
              <button onClick={handleRotate} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                <RotateCw className="w-5 h-5" />
              </button>
            </>
          )}
          
          {/* Fullscreen toggle */}
          <button onClick={toggleFullscreen} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          
          {/* Download button */}
          {file.downloadable && (
            <button 
              onClick={handleDownload} 
              className="flex items-center gap-2 px-3 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          )}
          
          {/* Close button */}
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-4">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
            <p className="text-gray-400">Loading file...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 text-red-400">
            <File className="w-12 h-12" />
            <p>{error}</p>
          </div>
        ) : fileUrl ? (
          <>
            {fileType === 'image' && (
              <img 
                src={fileUrl} 
                alt={file.name}
                className="max-w-full max-h-full object-contain transition-transform duration-200"
                style={{ 
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  cursor: zoom > 1 ? 'move' : 'default'
                }}
                draggable={false}
              />
            )}
            
            {fileType === 'video' && (
              <video 
                src={fileUrl} 
                controls 
                className="max-w-full max-h-full"
                controlsList={!file.downloadable ? 'nodownload' : undefined}
              >
                Your browser does not support video playback.
              </video>
            )}
            
            {fileType === 'audio' && (
              <div className="flex flex-col items-center gap-6 p-8 bg-gray-800 rounded-xl">
                <Music className="w-24 h-24 text-cyan-400" />
                <p className="text-white font-medium">{file.name}</p>
                <audio 
                  src={fileUrl} 
                  controls 
                  className="w-full max-w-md"
                  controlsList={!file.downloadable ? 'nodownload' : undefined}
                />
              </div>
            )}
            
            {fileType === 'pdf' && (
              <iframe 
                src={fileUrl} 
                className="w-full h-full bg-white rounded"
                title={file.name}
              />
            )}
            
            {fileType === 'text' && (
              <iframe 
                src={fileUrl} 
                className="w-full h-full bg-gray-900 text-white rounded font-mono p-4"
                title={file.name}
              />
            )}
            
            {fileType === 'other' && (
              <div className="flex flex-col items-center gap-4 p-8 bg-gray-800 rounded-xl">
                <File className="w-24 h-24 text-gray-400" />
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-gray-400 text-sm">Preview not available for this file type</p>
                {file.downloadable && (
                  <button 
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
                  >
                    <Download className="w-4 h-4" />
                    Download to view
                  </button>
                )}
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Footer with file info */}
      <div className="p-3 bg-gray-900/80 backdrop-blur text-center">
        <p className="text-sm text-gray-500">
          {file.viewOnly ? (
            <span className="flex items-center justify-center gap-2">
              <Eye className="w-4 h-4" />
              This file is view-only and cannot be downloaded
            </span>
          ) : (
            <span>Press Esc or click outside to close</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default MediaViewer;
