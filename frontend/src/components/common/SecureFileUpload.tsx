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
 * @file SecureFileUpload.tsx
 * @description Secure file upload component with encryption and validation
 */

import React, { useCallback, useState, useRef } from 'react';
import { Paperclip, Lock, AlertTriangle, Loader2 } from 'lucide-react';
import { FileId } from '../../types/core';
import { isDefined } from '../../types/utils/strictTypes';

const DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024;
const DEFAULT_ALLOWED_TYPES: string[] = [];

interface SecureFileUploadProps {
  maxFileSize?: number;
  allowedTypes?: string[];
  enableEncryption?: boolean;
  multiple?: boolean;
  onFileSelected: (files: File[]) => void;
  validateFile?: (file: File) => Promise<{ valid: boolean; message?: string }>;
  'aria-label'?: string;
}

export const SecureFileUpload: React.FC<SecureFileUploadProps> = ({
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  enableEncryption = true,
  multiple = false,
  onFileSelected,
  validateFile,
  'aria-label': ariaLabel = 'Upload file',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleFileSelection = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    setSelectedFiles(fileArray);
    setValidationErrors([]);
    setIsValidating(true);
    try {
      const errors: string[] = [];
      const validFiles: File[] = [];
      for (const file of fileArray) {
        if (file.size > maxFileSize) { errors.push(`${file.name} exceeds the maximum file size of ${formatFileSize(maxFileSize)}`); continue; }
        if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) { errors.push(`${file.name} has unsupported file type: ${file.type || 'unknown'}`); continue; }
        if (validateFile) { const { valid, message } = await validateFile(file); if (!valid) { errors.push(message || `${file.name} failed validation`); continue; } }
        validFiles.push(file);
      }
      if (errors.length > 0) { setValidationErrors(errors); showNotification('error', `${errors.length} file(s) could not be uploaded`); }
      if (validFiles.length > 0) { onFileSelected(validFiles); showNotification('success', `${validFiles.length} file(s) selected${enableEncryption ? ' - will be encrypted' : ''}`); }
    } catch (error) {
      setValidationErrors([`File processing error: ${error instanceof Error ? error.message : String(error)}`]);
      showNotification('error', 'An unexpected error occurred while processing your files');
    } finally {
      setIsValidating(false);
    }
  }, [maxFileSize, allowedTypes, validateFile, onFileSelected, enableEncryption]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => handleFileSelection(event.target.files);
  const handleDragEnter = (event: React.DragEvent) => { event.preventDefault(); event.stopPropagation(); setIsDragging(true); };
  const handleDragOver = (event: React.DragEvent) => { event.preventDefault(); event.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (event: React.DragEvent) => { event.preventDefault(); event.stopPropagation(); setIsDragging(false); };
  const handleDrop = (event: React.DragEvent) => { event.preventDefault(); event.stopPropagation(); setIsDragging(false); handleFileSelection(event.dataTransfer.files); };
  const handleClick = () => fileInputRef.current?.click();

  return (
    <div className="w-full space-y-4" data-testid="secure-file-upload">
      {notification && (
        <div className={`p-3 rounded-md text-sm ${notification.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>{notification.message}</div>
      )}
      <div
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-all ${isDragging ? 'border-blue-500 bg-blue-900/20' : 'border-gray-600 bg-gray-800'}`}
        onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={handleClick}
        aria-label={ariaLabel} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
      >
        <input type="file" multiple={multiple} onChange={handleChange} ref={fileInputRef} className="hidden" accept={allowedTypes.join(',')} data-testid="file-input" aria-hidden="true" />
        <div className="space-y-2">
          <Paperclip className="w-8 h-8 mx-auto text-gray-400" />
          <p className="font-medium text-gray-300">Drag and drop files here or click to browse</p>
          <p className="text-sm text-gray-400">{multiple ? 'You can upload multiple files' : 'You can upload one file'}{allowedTypes.length > 0 && ` of type: ${allowedTypes.join(', ')}`}</p>
          <p className="text-sm text-gray-400">Maximum file size: {formatFileSize(maxFileSize)}</p>
          {enableEncryption && <div className="flex items-center justify-center gap-1 text-green-400"><Lock className="w-4 h-4" /><span className="text-sm font-medium">Files are encrypted before upload</span></div>}
        </div>
      </div>
      {isValidating && <div className="mt-4"><p className="text-gray-300 mb-2">Validating files...</p><div className="h-2 bg-gray-700 rounded overflow-hidden"><div className="h-full bg-blue-500 animate-pulse w-full"></div></div></div>}
      {validationErrors.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-red-400" /><span className="font-medium text-red-400">{validationErrors.length} validation error(s)</span></div>
          {validationErrors.map((error, index) => <p key={index} className="text-red-400 text-sm">{error}</p>)}
        </div>
      )}
      {selectedFiles.length > 0 && !isValidating && (
        <div className="mt-4">
          <p className="font-medium text-gray-300 mb-2">Selected files: {selectedFiles.length}</p>
          <div className="space-y-1">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex justify-between p-2 bg-gray-700 rounded-md"><span className="text-sm text-gray-300 truncate">{file.name}</span><span className="text-sm text-gray-500">{formatFileSize(file.size)}</span></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Format file size for display
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default SecureFileUpload;
