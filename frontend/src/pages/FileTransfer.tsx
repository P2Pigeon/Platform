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
 * @file FileTransfer.tsx
 * @description This component serves as the lobby for creating and joining secure data rooms.
 * @module Pages/FileTransfer
 */
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Globe, X, Loader2 } from 'lucide-react';
import { createDataRoom, joinDataRoom, DataRoomAccessType } from '../services/dataroom/DataRoomAPI';
import { Button } from '../components/ui/button';

const FileTransfer: React.FC = () => {
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [roomName, setRoomName] = useState<string>('');
  const [roomKey, setRoomKey] = useState<string>('');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [roomNameError, setRoomNameError] = useState<string>('');
  const [roomKeyError, setRoomKeyError] = useState<string>('');
  const [accessType, setAccessType] = useState<DataRoomAccessType>('open');
  const [ndaText, setNdaText] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreateRoom = useCallback(async () => {
    if (!roomName.trim()) { setRoomNameError('Room name is required'); return; }
    setRoomNameError('');
    try {
      setIsCreating(true);
      const room = await createDataRoom(roomName, { description: `Secure data room: ${roomName}`, accessType, ndaText: accessType === 'closed' ? ndaText : undefined });
      setIsCreateOpen(false);
      navigate(`/app/data-room/${room.id}`);
      showNotification('success', `You've successfully created data room: ${roomName}`);
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsCreating(false);
    }
  }, [roomName, accessType, ndaText, navigate]);

  const handleJoinRoom = useCallback(async () => {
    if (!roomKey.trim()) { setRoomKeyError('Room key is required'); return; }
    setRoomKeyError('');
    try {
      setIsJoining(true);
      const room = await joinDataRoom(roomKey);
      setIsJoinOpen(false);
      navigate(`/app/data-room/${room.id}`);
      showNotification('success', `You've successfully joined the data room`);
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsJoining(false);
    }
  }, [roomKey, navigate]);

  const handleRoomNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomName(e.target.value);
    if (roomNameError) setRoomNameError('');
  }, [roomNameError]);

  const handleRoomKeyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomKey(e.target.value);
    if (roomKeyError) setRoomKeyError('');
  }, [roomKeyError]);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <h1 className="text-3xl font-bold text-white text-center">File Transfer</h1>
      <p className="text-gray-400 text-center">Share files securely with peers through encrypted data rooms</p>

      {notification && (
        <div className={`p-4 rounded-md ${notification.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>{notification.message}</div>
      )}

      <div className="flex gap-4 justify-center">
        <Button onClick={() => { setRoomNameError(''); setIsCreateOpen(true); }} size="lg">Create Data Room</Button>
        <Button onClick={() => { setRoomKeyError(''); setIsJoinOpen(true); }} variant="secondary" size="lg">Join Data Room</Button>
      </div>

      <div className="bg-gray-800 rounded-lg">
        <div className="p-4"><h2 className="text-lg font-semibold text-white">How It Works</h2></div>
        <div className="p-4 space-y-3 text-gray-300">
          <p><strong className="text-white">Create a Data Room:</strong> Start your own secure space where peers can connect and share files.</p>
          <p><strong className="text-white">Join a Data Room:</strong> Connect to an existing room by entering the room key provided by the host.</p>
          <p><strong className="text-white">Share Files:</strong> Once connected, you can upload files that will be available to all peers in the room.</p>
          <p><strong className="text-white">Download Files:</strong> Browse and download files shared by other peers in the room.</p>
          <p className="font-bold text-white">All transfers are end-to-end encrypted and peer-to-peer. No central server stores your files.</p>
        </div>
      </div>

      {/* Create Room Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsCreateOpen(false)}>
          <div className="bg-gray-800 rounded-lg w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Create a New Data Room</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Room Name</label>
                <input value={roomName} onChange={handleRoomNameChange} placeholder="Enter a name for your data room" className={`w-full px-3 py-2 bg-gray-900 border rounded text-white placeholder-gray-500 ${roomNameError ? 'border-red-500' : 'border-gray-600'}`} />
                {roomNameError && <p className="text-red-400 text-sm mt-1">{roomNameError}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Access Type</label>
                <div className="space-y-3">
                  <div onClick={() => setAccessType('open')} className={`p-3 border rounded-md cursor-pointer ${accessType === 'open' ? 'border-cyan-500 bg-cyan-500/10' : 'border-gray-600'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" checked={accessType === 'open'} onChange={() => setAccessType('open')} className="w-4 h-4 text-cyan-500" />
                      <Globe className="w-5 h-5 text-green-400" />
                      <div className="flex-1"><p className="font-medium text-white">Open Access</p><p className="text-sm text-gray-400">Anyone with the room key can join immediately</p></div>
                      <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">Public</span>
                    </div>
                  </div>
                  <div onClick={() => setAccessType('closed')} className={`p-3 border rounded-md cursor-pointer ${accessType === 'closed' ? 'border-cyan-500 bg-cyan-500/10' : 'border-gray-600'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" checked={accessType === 'closed'} onChange={() => setAccessType('closed')} className="w-4 h-4 text-cyan-500" />
                      <Lock className="w-5 h-5 text-orange-400" />
                      <div className="flex-1"><p className="font-medium text-white">Closed Access (NDA Required)</p><p className="text-sm text-gray-400">Users must agree to terms and be approved by you</p></div>
                      <span className="px-2 py-0.5 text-xs bg-orange-500/20 text-orange-400 rounded">Private</span>
                    </div>
                  </div>
                </div>
              </div>
              {accessType === 'closed' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">NDA / Terms of Access</label>
                  <textarea value={ndaText} onChange={e => setNdaText(e.target.value)} placeholder="Enter the terms users must agree to before accessing this room..." rows={5} className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white placeholder-gray-500" />
                  <p className="text-xs text-gray-500 mt-1">Users will need to acknowledge these terms before requesting access</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-700">
              <Button onClick={() => setIsCreateOpen(false)} variant="ghost">Cancel</Button>
              <Button onClick={handleCreateRoom} disabled={isCreating}>
                {isCreating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating</> : 'Create Room'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Join Room Modal */}
      {isJoinOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsJoinOpen(false)}>
          <div className="bg-gray-800 rounded-lg w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Join a Data Room</h3>
              <button onClick={() => setIsJoinOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Room Key</label>
              <input value={roomKey} onChange={handleRoomKeyChange} placeholder="Enter the room key" className={`w-full px-3 py-2 bg-gray-900 border rounded text-white placeholder-gray-500 ${roomKeyError ? 'border-red-500' : 'border-gray-600'}`} />
              {roomKeyError && <p className="text-red-400 text-sm mt-1">{roomKeyError}</p>}
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-700">
              <Button onClick={() => setIsJoinOpen(false)} variant="ghost">Cancel</Button>
              <Button onClick={handleJoinRoom} disabled={isJoining}>
                {isJoining ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining</> : 'Join Room'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileTransfer;
