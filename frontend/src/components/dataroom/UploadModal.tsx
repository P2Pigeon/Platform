/**
 * P2Pigeon - Secure P2P Communication Platform
 * 
 * @license AGPL-3.0 - https://opensource.org/licenses/AGPL-3.0
 * @copyright 2024-2026 P2Pigeon Contributors
 * @see https://github.com/p2pigeon/platform
 */

import React, { useState, useRef } from 'react';
import { X, Upload, Download, Eye, EyeOff, File, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadFile, UploadProgress, formatFileSize } from '../../services/dataroom/DataRoomAPI';

interface UploadModalProps {
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

interface FileToUpload {
  file: File;
  downloadable: boolean;
  viewOnly: boolean;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  progress: number;
  error?: string;
}

const UploadModal: React.FC<UploadModalProps> = ({ roomId, isOpen, onClose, onUploadComplete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filesToUpload, setFilesToUpload] = useState<FileToUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [defaultDownloadable, setDefaultDownloadable] = useState(true);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const newFiles: FileToUpload[] = Array.from(selectedFiles).map(file => ({
      file,
      downloadable: defaultDownloadable,
      viewOnly: !defaultDownloadable,
      status: 'pending',
      progress: 0
    }));

    setFilesToUpload(prev => [...prev, ...newFiles]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateFileOption = (index: number, option: 'downloadable' | 'viewOnly', value: boolean) => {
    setFilesToUpload(prev => prev.map((f, i) => {
      if (i !== index) return f;
      if (option === 'downloadable') {
        return { ...f, downloadable: value, viewOnly: !value };
      } else {
        return { ...f, viewOnly: value, downloadable: !value };
      }
    }));
  };

  const removeFile = (index: number) => {
    setFilesToUpload(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (filesToUpload.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < filesToUpload.length; i++) {
      const fileData = filesToUpload[i];
      if (fileData.status !== 'pending') continue;

      setFilesToUpload(prev => prev.map((f, idx) => 
        idx === i ? { ...f, status: 'uploading' } : f
      ));

      try {
        await uploadFile(
          roomId, 
          fileData.file, 
          { downloadable: fileData.downloadable, viewOnly: fileData.viewOnly },
          (progress: UploadProgress) => {
            setFilesToUpload(prev => prev.map((f, idx) => 
              idx === i ? { ...f, progress: progress.percentage } : f
            ));
          }
        );

        setFilesToUpload(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'complete', progress: 100 } : f
        ));
      } catch (err) {
        setFilesToUpload(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'error', error: err instanceof Error ? err.message : 'Upload failed' } : f
        ));
      }
    }

    setIsUploading(false);
    onUploadComplete();
  };

  const handleClose = () => {
    if (!isUploading) {
      setFilesToUpload([]);
      onClose();
    }
  };

  const pendingCount = filesToUpload.filter(f => f.status === 'pending').length;
  const completedCount = filesToUpload.filter(f => f.status === 'complete').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="bg-gray-800 rounded-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Upload Files</h2>
          </div>
          <button 
            onClick={handleClose} 
            disabled={isUploading}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-700 bg-gray-900/50">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-300">Default Permission</label>
            <div className="flex gap-2">
              <button
                onClick={() => setDefaultDownloadable(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
                  defaultDownloadable 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                <Download className="w-4 h-4" />
                Downloadable
              </button>
              <button
                onClick={() => setDefaultDownloadable(false)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
                  !defaultDownloadable 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                <EyeOff className="w-4 h-4" />
                View Only
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            {defaultDownloadable 
              ? 'Users can download these files to their device'
              : 'Users can only view these files in the media viewer (no download)'}
          </p>
        </div>

        <div className="p-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full p-8 border-2 border-dashed border-gray-600 rounded-lg hover:border-cyan-500 hover:bg-gray-700/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-gray-400" />
              <p className="text-gray-400">Click to select files or drag and drop</p>
              <p className="text-xs text-gray-500">You can select multiple files</p>
            </div>
          </button>
        </div>

        {filesToUpload.length > 0 && (
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="space-y-2">
              {filesToUpload.map((fileData, index) => (
                <div 
                  key={`${fileData.file.name}-${index}`}
                  className="bg-gray-900 rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <File className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{fileData.file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(fileData.file.size)}</p>
                    </div>
                    
                    {fileData.status === 'pending' && (
                      <>
                        <div className="flex gap-1">
                          <button
                            onClick={() => updateFileOption(index, 'downloadable', true)}
                            className={`p-1.5 rounded ${fileData.downloadable ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                            title="Downloadable"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateFileOption(index, 'viewOnly', true)}
                            className={`p-1.5 rounded ${fileData.viewOnly ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                            title="View Only"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="p-1.5 text-red-400 hover:bg-red-500/10 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    
                    {fileData.status === 'uploading' && (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                        <span className="text-sm text-cyan-400">{fileData.progress}%</span>
                      </div>
                    )}
                    
                    {fileData.status === 'complete' && (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                    
                    {fileData.status === 'error' && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <span className="text-xs text-red-400">{fileData.error}</span>
                      </div>
                    )}
                  </div>
                  
                  {fileData.status === 'uploading' && (
                    <div className="mt-2 h-1 bg-gray-700 rounded overflow-hidden">
                      <div 
                        className="h-full bg-cyan-500 transition-all duration-300"
                        style={{ width: `${fileData.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-t border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {filesToUpload.length > 0 && (
              <span>{completedCount}/{filesToUpload.length} uploaded</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded disabled:opacity-50"
            >
              {completedCount > 0 ? 'Done' : 'Cancel'}
            </button>
            {pendingCount > 0 && (
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload {pendingCount} file{pendingCount > 1 ? 's' : ''}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
