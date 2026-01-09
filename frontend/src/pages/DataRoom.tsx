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
 * @file DataRoom.tsx
 * @description Secure data room UI for file sharing via Hyperdrive backend.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clipboard, ClipboardCheck, Upload, Lock, Download, Trash2, File, RefreshCw, Users, Check, X, UserMinus, Globe, Eye, FileText, Loader2, AlertTriangle } from 'lucide-react';
import {
  getDataRoomWithAccess, listFiles, uploadFile, downloadFile, deleteFile, formatFileSize,
  DataRoom as DataRoomType, DataRoomFile, UploadProgress, AccessRequest,
  getPendingRequests, approveAccess, rejectAccess, removeUserAccess,
  connectToRoom, disconnectFromRoom, getCurrentUserId, requestAccess, UserAccessStatus
} from '../services/dataroom/DataRoomAPI';

const DataRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [room, setRoom] = useState<DataRoomType | null>(null);
  const [files, setFiles] = useState<DataRoomFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);
  const [accessStatus, setAccessStatus] = useState<UserAccessStatus>('none');
  const [hasFileAccess, setHasFileAccess] = useState(false);
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);
  const [accessRequestForm, setAccessRequestForm] = useState({ userName: '', email: '', message: '' });
  const [hasCopied, setHasCopied] = useState(false);
  const [isNdaOpen, setIsNdaOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const currentUserId = getCurrentUserId();

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(roomId || '');
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleDownloadNda = () => {
    if (!room?.ndaText) return;
    const blob = new Blob([room.ndaText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${room.name || 'DataRoom'}_NDA_Terms.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    showNotification('success', 'NDA Downloaded');
  };

  // Load room data
  const loadRoom = useCallback(async () => {
    if (!roomId) {
      navigate('/app/files');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await getDataRoomWithAccess(roomId);
      if (!response) {
        throw new Error('Room not found');
      }
      
      setRoom(response.room);
      setAccessStatus(response.accessStatus);
      setHasFileAccess(response.hasFileAccess);

      // Only load files if user has access
      if (response.hasFileAccess) {
        const fileList = await listFiles(roomId);
        setFiles(fileList);
      }

      // Load pending requests if owner
      if (response.accessStatus === 'owner') {
        const requests = await getPendingRequests(roomId);
        setPendingRequests(requests);
      }

      // Mark as connected
      await connectToRoom(roomId);
    } catch (err) {
      console.error('Failed to load room:', err);
      setError(err instanceof Error ? err.message : 'Failed to load room');
      showNotification('error', 'Room not found');
      navigate('/app/files');
    } finally {
      setIsLoading(false);
    }
  }, [roomId, navigate, currentUserId]);

  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  // Handle file upload button click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection
  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0 || !roomId) return;

    setIsUploading(true);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        showNotification('info', `Uploading ${file.name}`);

        await uploadFile(roomId, file, (progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: progress
          }));
        });

        showNotification('success', `${file.name} uploaded`);
      }

      // Refresh file list
      const fileList = await listFiles(roomId);
      setFiles(fileList);
    } catch (err) {
      showNotification('error', 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle downloading a file
  const handleDownloadFile = async (file: DataRoomFile) => {
    if (!roomId) return;

    try {
      showNotification('info', `Downloading ${file.name}`);

      const blob = await downloadFile(roomId, file.path);
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showNotification('success', `${file.name} downloaded`);
    } catch (err) {
      showNotification('error', 'Download failed');
    }
  };

  // Handle deleting a file
  const handleDeleteFile = async (file: DataRoomFile) => {
    if (!roomId) return;

    try {
      await deleteFile(roomId, file.path);
      
      showNotification('success', `${file.name} deleted`);

      // Refresh file list
      const fileList = await listFiles(roomId);
      setFiles(fileList);
    } catch (err) {
      showNotification('error', 'Delete failed');
    }
  };

  // Handle leaving the room
  const handleLeaveRoom = async () => {
    if (roomId) {
      await disconnectFromRoom(roomId);
    }
    navigate('/app/files');
  };

  // Handle approving access request
  const handleApproveRequest = async (requestId: string) => {
    if (!roomId) return;
    try {
      await approveAccess(roomId, requestId);
      showNotification('success', 'Access approved');
      loadRoom(); // Refresh to update lists
    } catch (err) {
      showNotification('error', 'Failed to approve access');
    }
  };

  // Handle rejecting access request
  const handleRejectRequest = async (requestId: string) => {
    if (!roomId) return;
    try {
      await rejectAccess(roomId, requestId);
      showNotification('info', 'Access rejected');
      loadRoom();
    } catch (err) {
      showNotification('error', 'Failed to reject access');
    }
  };

  // Handle removing user access
  const handleRemoveUser = async (userId: string) => {
    if (!roomId) return;
    try {
      await removeUserAccess(roomId, userId);
      showNotification('info', 'User removed');
      loadRoom();
    } catch (err) {
      showNotification('error', 'Failed to remove user');
    }
  };

  // Check if current user is owner
  const isOwner = room?.owner === currentUserId;

  // Handle submitting access request
  const handleSubmitAccessRequest = async () => {
    if (!roomId) return;
    
    setIsRequestingAccess(true);
    try {
      await requestAccess(roomId, {
        userName: accessRequestForm.userName,
        email: accessRequestForm.email,
        message: accessRequestForm.message,
        agreedToTerms: true
      });
      
      showNotification('success', 'Access request submitted');
      
      // Refresh to show pending status
      loadRoom();
    } catch (err) {
      showNotification('error', 'Request failed');
    } finally {
      setIsRequestingAccess(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4 flex flex-col items-center">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
        <p className="mt-4 text-gray-300">Loading data room...</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex items-start gap-3 p-4 bg-red-900/50 rounded-md">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div><p className="font-bold text-red-300">Error</p><p className="text-red-200">{error || 'Room not found'}</p></div>
        </div>
      </div>
    );
  }

  if (!hasFileAccess && room.accessType === 'closed') {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
        {notification && <div className={`fixed top-4 right-4 z-50 p-3 rounded ${notification.type === 'success' ? 'bg-green-900/90 text-green-300' : notification.type === 'error' ? 'bg-red-900/90 text-red-300' : 'bg-blue-900/90 text-blue-300'}`}>{notification.message}</div>}
        <div className="text-center"><Lock className="w-12 h-12 text-orange-400 mx-auto mb-4" /><h1 className="text-2xl font-bold text-white">{room.name || 'Private Data Room'}</h1><p className="text-gray-500 mt-2">This room requires approval to access files</p></div>
        {accessStatus === 'pending' && <div className="flex items-start gap-3 p-4 bg-blue-900/50 rounded-md"><div><p className="font-bold text-blue-300">Access Request Pending</p><p className="text-blue-200">Your request is being reviewed by the room owner.</p></div></div>}
        {room.ndaText && accessStatus === 'none' && (
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3"><FileText className="w-5 h-5 text-orange-400" /><h3 className="font-semibold text-white">Terms & Conditions (NDA)</h3></div>
            <div className="p-4 bg-gray-900 rounded-md max-h-72 overflow-y-auto font-mono text-sm whitespace-pre-wrap text-gray-300 mb-4">{room.ndaText}</div>
            <p className="text-sm text-gray-500">By requesting access, you agree to the above terms.</p>
          </div>
        )}
        {accessStatus === 'none' && (
          <div className="bg-gray-800 rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-white">Request Access</h3>
            <div><label className="block text-sm font-medium text-gray-300 mb-1">Your Name</label><input type="text" placeholder="Enter your name" value={accessRequestForm.userName} onChange={e => setAccessRequestForm(p => ({ ...p, userName: e.target.value }))} className="w-full px-3 py-2 bg-gray-900 rounded text-white" /></div>
            <div><label className="block text-sm font-medium text-gray-300 mb-1">Email</label><input type="email" placeholder="Enter your email" value={accessRequestForm.email} onChange={e => setAccessRequestForm(p => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 bg-gray-900 rounded text-white" /></div>
            <div><label className="block text-sm font-medium text-gray-300 mb-1">Message (Optional)</label><input type="text" placeholder="Add a message" value={accessRequestForm.message} onChange={e => setAccessRequestForm(p => ({ ...p, message: e.target.value }))} className="w-full px-3 py-2 bg-gray-900 rounded text-white" /></div>
            <button onClick={handleSubmitAccessRequest} disabled={isRequestingAccess} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50">
              {isRequestingAccess ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {room.ndaText ? 'Agree to Terms & Request Access' : 'Request Access'}
            </button>
          </div>
        )}
        <button onClick={handleLeaveRoom} className="w-full px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-700">Leave Room</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {notification && <div className={`fixed top-4 right-4 z-50 p-3 rounded ${notification.type === 'success' ? 'bg-green-900/90 text-green-300' : notification.type === 'error' ? 'bg-red-900/90 text-red-300' : 'bg-blue-900/90 text-blue-300'}`}>{notification.message}</div>}
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h1 className="text-2xl font-bold text-white">{room.name || 'Data Room'}</h1><div className="flex items-center gap-2 mt-1 text-gray-500 text-sm"><Lock className="w-4 h-4" /> Secure file storage</div></div>
        <div className="flex items-center gap-2">
          <button onClick={loadRoom} className="p-2 bg-gray-700 rounded hover:bg-gray-700"><RefreshCw className="w-4 h-4 text-gray-300" /></button>
          <button onClick={handleUploadClick} disabled={isUploading} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50">{isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload Files</button>
          <button onClick={handleLeaveRoom} className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-700">Leave Room</button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelected} multiple />
        </div>
      </div>
      {/* Room ID Sharing */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-2">Share this Room ID with others</h3>
        <div className="flex"><input type="text" value={roomId} readOnly className="flex-1 px-3 py-2 bg-gray-900 rounded-l font-mono text-sm text-gray-300" /><button onClick={handleCopy} className="px-4 py-2 bg-gray-700 rounded-r hover:bg-gray-600">{hasCopied ? <ClipboardCheck className="w-4 h-4 text-green-400" /> : <Clipboard className="w-4 h-4 text-gray-300" />}</button></div>
      </div>
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Files Section */}
        <div className="lg:col-span-2 bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-semibold text-white">Files ({files.length})</h2><span className="px-2 py-1 bg-green-600/30 text-green-300 text-xs rounded">{room.fileCount || files.length} files</span></div>
          {files.length === 0 ? (
            <div className="text-center py-10"><File className="w-12 h-12 text-gray-500 mx-auto mb-4" /><p className="text-gray-500">No files have been shared yet</p><button onClick={handleUploadClick} className="mt-4 flex items-center gap-2 px-4 py-2 bg-cyan-600/20 text-cyan-400 rounded hover:bg-cyan-600/10 mx-auto"><Upload className="w-4 h-4" /> Upload the first file</button></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {files.map((file, index) => (
                <div key={file.id || `file-${index}`} className="bg-gray-900 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2"><File className="w-4 h-4 text-cyan-400" /><span className="font-medium text-white truncate" title={file.name}>{file.name}</span></div>
                  <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                  {uploadProgress[file.name] && <div className="h-1 bg-gray-700 rounded"><div className="h-1 bg-cyan-500 rounded" style={{ width: `${uploadProgress[file.name].percentage}%` }} /></div>}
                  <div className="flex gap-2"><button onClick={() => handleDownloadFile(file)} className="p-2 bg-gray-700 rounded hover:bg-gray-700"><Download className="w-4 h-4 text-gray-300" /></button><button onClick={() => handleDeleteFile(file)} className="p-2 text-red-400 hover:bg-red-500/10 rounded"><Trash2 className="w-4 h-4" /></button></div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Room Info */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">{room.accessType === 'closed' ? <Lock className="w-4 h-4 text-orange-400" /> : <Globe className="w-4 h-4 text-green-400" />}<h3 className="font-semibold text-white">{room.accessType === 'closed' ? 'Private Room' : 'Open Access'}</h3>{isOwner && <span className="px-2 py-0.5 bg-purple-600/30 text-purple-300 text-xs rounded">Owner</span>}</div>
            <p className="text-sm text-gray-500">{room.accessType === 'closed' ? 'Users must request access and be approved' : 'Anyone with the room key can join'}</p>
            {isOwner && room.accessType === 'closed' && room.ndaText && (
              <div className="mt-3 p-3 bg-orange-900/30 rounded-md">
                <div className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-orange-400" /><span className="text-sm font-bold text-white">NDA / Terms</span></div>
                <div className="flex gap-2"><button onClick={() => setIsNdaOpen(true)} className="flex items-center gap-1 px-3 py-1.5 bg-orange-900/30 text-orange-400 text-sm rounded hover:bg-orange-500/10"><Eye className="w-3 h-3" /> View</button><button onClick={handleDownloadNda} className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"><Download className="w-3 h-3" /> Download</button></div>
              </div>
            )}
          </div>
          {/* Connected Users */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-cyan-400" /><h3 className="font-semibold text-white">Connected Users ({room.connectedUsers?.length || 0})</h3></div>
            {room.connectedUsers && room.connectedUsers.length > 0 ? (
              <div className="space-y-2">{room.connectedUsers.map((userId, index) => (
                <div key={`user-${userId}-${index}`} className="flex justify-between items-center p-2 bg-gray-900/50 rounded">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-400 rounded-full" /><span className="text-sm font-mono text-gray-300 truncate max-w-[120px]">{userId === currentUserId ? 'You' : userId.slice(0, 8) + '...'}</span>{userId === room.owner && <span className="px-1.5 py-0.5 bg-purple-600/30 text-purple-300 text-xs rounded">Owner</span>}</div>
                  {isOwner && userId !== room.owner && <button onClick={() => handleRemoveUser(userId)} className="p-1 text-red-400 hover:bg-red-500/10 rounded"><UserMinus className="w-3 h-3" /></button>}
                </div>
              ))}</div>
            ) : <p className="text-sm text-gray-500">No users connected</p>}
          </div>
          {/* Pending Requests */}
          {isOwner && room.accessType === 'closed' && (
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2"><Lock className="w-4 h-4 text-orange-400" /><h3 className="font-semibold text-white">Pending Requests ({pendingRequests.length})</h3></div>
              {pendingRequests.length > 0 ? (
                <div className="space-y-3">{pendingRequests.map((request, index) => (
                  <div key={request.id || `req-${index}`} className="p-3 bg-orange-900/30 rounded-md space-y-2">
                    <div className="flex justify-between"><span className="font-bold text-sm text-white">{request.userName || request.userId.slice(0, 8) + '...'}</span><span className="px-2 py-0.5 bg-orange-600/30 text-orange-300 text-xs rounded">Pending</span></div>
                    {request.email && <p className="text-xs text-gray-500">{request.email}</p>}
                    {request.message && <p className="text-sm italic text-gray-400">"{request.message}"</p>}
                    <div className="flex gap-2"><button onClick={() => handleApproveRequest(request.id)} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"><Check className="w-3 h-3" /> Approve</button><button onClick={() => handleRejectRequest(request.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-900/50 text-red-400 text-sm rounded hover:bg-red-500/10"><X className="w-3 h-3" /> Reject</button></div>
                  </div>
                ))}</div>
              ) : <p className="text-sm text-gray-500">No pending requests</p>}
            </div>
          )}
          {/* Approved Members */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-2">Approved Members ({room.participants?.length || 0})</h3>
            {room.participants && room.participants.length > 0 ? (
              <div className="space-y-1">{room.participants.map((userId, index) => (
                <div key={`participant-${userId}-${index}`} className="flex justify-between py-1"><span className="text-sm font-mono text-gray-300 truncate max-w-[150px]">{userId === currentUserId ? 'You' : userId.slice(0, 12) + '...'}</span>{userId === room.owner && <span className="px-1.5 py-0.5 bg-purple-600/30 text-purple-300 text-xs rounded">Owner</span>}</div>
              ))}</div>
            ) : <p className="text-sm text-gray-500">No members</p>}
          </div>
        </div>
      </div>
      {/* NDA Modal */}
      {isNdaOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsNdaOpen(false)}>
          <div className="bg-gray-800 rounded-lg w-full max-w-2xl mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-700"><div className="flex items-center gap-2"><FileText className="w-5 h-5 text-orange-400" /><span className="font-semibold text-white">NDA / Terms Document</span></div><button onClick={() => setIsNdaOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button></div>
            <div className="p-4"><div className="p-4 bg-gray-900 rounded-md max-h-96 overflow-y-auto font-mono text-sm whitespace-pre-wrap text-gray-300">{room?.ndaText || 'No terms document available'}</div></div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-700"><button onClick={() => setIsNdaOpen(false)} className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded">Close</button><button onClick={() => { handleDownloadNda(); setIsNdaOpen(false); }} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"><Download className="w-4 h-4" /> Download</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataRoom;
