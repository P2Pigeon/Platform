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
 * @file StartCall.tsx
 * @description A page component that allows users to either create a new secure communication room or join an existing one.
 * @module Pages/StartCall
 */
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';

// Word lists for generating memorable room names
const adjectives = ['swift', 'brave', 'cosmic', 'mystic', 'golden', 'silver', 'iron', 'crystal', 'shadow', 'thunder', 'cyber', 'digital', 'quantum', 'stellar', 'lunar', 'solar', 'arctic', 'blazing', 'silent', 'mighty'];
const nouns = ['wolf', 'eagle', 'phoenix', 'dragon', 'falcon', 'panther', 'tiger', 'hawk', 'raven', 'cobra', 'viper', 'storm', 'blade', 'spark', 'forge', 'nexus', 'vault', 'cipher', 'matrix', 'pulse'];

const generateRoomName = (): string => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
  return `${adj}-${noun}-${num}`;
};

const StartCall: React.FC = () => {
  const [roomKey, setRoomKey] = useState<string>('');
  const [roomKeyError, setRoomKeyError] = useState<string>('');
  const [newRoomName, setNewRoomName] = useState<string>(generateRoomName);
  const [protocol, setProtocol] = useState<'webrtc' | 'hyperswarm'>('webrtc');
  const navigate = useNavigate();

  const regenerateRoomName = useCallback(() => {
    setNewRoomName(generateRoomName());
  }, []);

  const createNewRoom = (): void => {
    const roomId = newRoomName.trim() || generateRoomName();
    navigate(`/app/join/${roomId}?protocol=${protocol}`);
  };

  const joinRoom = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!roomKey.trim()) { setRoomKeyError('Please enter a room key'); return; }
    setRoomKeyError('');
    navigate(`/app/join/${roomKey}?protocol=${protocol}`);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <h1 className="text-3xl font-bold text-white text-center">Create or Join a Secure Room</h1>

      {/* Protocol Selector */}
      <div className="bg-gray-800 rounded-lg p-4">
        <label className="block font-bold text-white mb-3">Connection Protocol</label>
        <div className="space-y-4">
          <div onClick={() => setProtocol('webrtc')} className={`p-3 rounded-lg cursor-pointer ${protocol === 'webrtc' ? 'bg-cyan-500/20' : 'bg-gray-700'}`}>
            <div className="flex items-center gap-3">
              <input type="radio" checked={protocol === 'webrtc'} onChange={() => setProtocol('webrtc')} className="w-4 h-4 text-cyan-500" />
              <span className="font-medium text-white">WebRTC</span>
              <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded">Recommended</span>
            </div>
            <p className="text-sm text-gray-400 ml-7 mt-1">Browser-native peer-to-peer video/audio. Works in all modern browsers. Best compatibility and reliability.</p>
          </div>
          <div onClick={() => setProtocol('hyperswarm')} className={`p-3 rounded-lg cursor-pointer ${protocol === 'hyperswarm' ? 'bg-green-500/20' : 'bg-gray-700'}`}>
            <div className="flex items-center gap-3">
              <input type="radio" checked={protocol === 'hyperswarm'} onChange={() => setProtocol('hyperswarm')} className="w-4 h-4 text-green-500" />
              <span className="font-medium text-white">Hyperswarm + WebRTC (Experimental)</span>
            </div>
            <p className="text-sm text-gray-400 ml-7 mt-1">Decentralized peer discovery via DHT with WebRTC media. Browser-native P2P architecture.</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Room Card */}
        <div className="bg-gray-800 rounded-lg flex flex-col">
          <div className="p-4"><h2 className="text-lg font-semibold text-white">Create a New Room</h2></div>
          <div className="p-4 flex-1">
            <p className="text-gray-400 mb-4">Create a room with a custom or generated name.</p>
            <label htmlFor="newRoomName" className="block text-sm font-medium text-gray-300 mb-1">Room Name</label>
            <div className="flex gap-2">
              <input 
                id="newRoomName" 
                name="newRoomName" 
                value={newRoomName} 
                onChange={(e) => setNewRoomName(e.target.value)} 
                placeholder="Enter room name..." 
                className="flex-1 px-3 py-2 bg-gray-900 rounded text-white placeholder-gray-500"
              />
              <button 
                type="button"
                onClick={regenerateRoomName}
                className="px-3 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                title="Generate new name"
              >
                <RefreshCw size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Tip: Use a memorable name to easily share with others</p>
          </div>
          <div className="p-4"><button onClick={createNewRoom} className="w-full px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700">Create New Room</button></div>
        </div>
        
        {/* Join Room Card */}
        <div className="bg-gray-800 rounded-lg flex flex-col">
          <div className="p-4"><h2 className="text-lg font-semibold text-white">Join an Existing Room</h2></div>
          <div className="p-4 flex-1">
            <p className="text-gray-400 mb-4">Enter a room key to join a call in progress.</p>
            <form onSubmit={joinRoom}>
              <label htmlFor="roomKey" className="block text-sm font-medium text-gray-300 mb-1">Room Key</label>
              <input id="roomKey" name="roomKey" value={roomKey} onChange={(e) => setRoomKey(e.target.value)} placeholder="Enter room key..." className={`w-full px-3 py-2 bg-gray-900 rounded text-white placeholder-gray-500 ${roomKeyError ? 'ring-1 ring-red-500' : ''}`} />
              {roomKeyError && <p className="text-red-400 text-sm mt-1">{roomKeyError}</p>}
            </form>
          </div>
          <div className="p-4"><button onClick={joinRoom} className="w-full px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700">Join Room</button></div>
        </div>
      </div>
      
      <div className="p-4 bg-blue-900/50 rounded-md">
        <p className="text-sm text-blue-300">All rooms are end-to-end encrypted and your data never passes through any central servers. For maximum security, share room keys via a secure channel.</p>
      </div>
    </div>
  );
};

export default StartCall;
