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
 * @file JoinRoomModal.tsx
 * @description Pre-join modal for setting up camera, mic, and display name before entering a room
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Video, VideoOff, Mic, MicOff, Settings, User } from 'lucide-react';

interface JoinRoomModalProps {
  isOpen: boolean;
  onJoin: (settings: JoinSettings) => void;
  onCancel: () => void;
  roomId: string;
}

export interface JoinSettings {
  displayName: string;
  videoEnabled: boolean;
  audioEnabled: boolean;
  videoDeviceId?: string;
  audioDeviceId?: string;
}

const JoinRoomModal: React.FC<JoinRoomModalProps> = ({ isOpen, onJoin, onCancel, roomId }) => {
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('pigeon_displayName') || '');
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Request permissions and get preview stream
  const initializePreview = useCallback(async () => {
    if (!isOpen) return;
    
    setIsLoading(true);
    setPermissionError(null);
    
    try {
      // Request permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled,
        audio: audioEnabled
      });
      
      setPreviewStream(stream);
      
      // Enumerate devices after getting permission
      const devices = await navigator.mediaDevices.enumerateDevices();
      setVideoDevices(devices.filter(d => d.kind === 'videoinput'));
      setAudioDevices(devices.filter(d => d.kind === 'audioinput'));
      
      // Set default devices
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      if (videoTrack) setSelectedVideoDevice(videoTrack.getSettings().deviceId || '');
      if (audioTrack) setSelectedAudioDevice(audioTrack.getSettings().deviceId || '');
      
    } catch (err: any) {
      console.error('Permission error:', err);
      if (err.name === 'NotAllowedError') {
        setPermissionError('Camera/microphone access denied. Please allow access to continue.');
      } else if (err.name === 'NotFoundError') {
        setPermissionError('No camera or microphone found.');
      } else if (err.message?.includes('allocate') || err.message?.includes('videosource')) {
        // Camera is in use by another application/tab
        setPermissionError('Camera is in use by another application. Please close other apps using the camera and try again.');
        // Try audio-only fallback
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          setPreviewStream(audioStream);
          setVideoEnabled(false);
          const devices = await navigator.mediaDevices.enumerateDevices();
          setAudioDevices(devices.filter(d => d.kind === 'audioinput'));
          setPermissionError('Camera unavailable. Joining with audio only.');
        } catch {
          // Even audio failed
        }
      } else {
        setPermissionError(`Error accessing devices: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, videoEnabled, audioEnabled]);

  // Initialize preview when modal opens
  useEffect(() => {
    if (isOpen) {
      initializePreview();
    }
    
    return () => {
      // Cleanup preview stream when modal closes
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && previewStream) {
      videoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (previewStream) {
      previewStream.getVideoTracks().forEach(track => {
        track.enabled = !videoEnabled;
      });
    }
    setVideoEnabled(!videoEnabled);
  }, [previewStream, videoEnabled]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (previewStream) {
      previewStream.getAudioTracks().forEach(track => {
        track.enabled = !audioEnabled;
      });
    }
    setAudioEnabled(!audioEnabled);
  }, [previewStream, audioEnabled]);

  // Handle join
  const handleJoin = useCallback(() => {
    // Stop preview stream - the actual stream will be created by the adapter
    if (previewStream) {
      previewStream.getTracks().forEach(track => track.stop());
    }
    
    // Save display name
    if (displayName) {
      localStorage.setItem('pigeon_displayName', displayName);
    }
    
    onJoin({
      displayName: displayName || `User_${Date.now()}`,
      videoEnabled,
      audioEnabled,
      videoDeviceId: selectedVideoDevice || undefined,
      audioDeviceId: selectedAudioDevice || undefined
    });
  }, [previewStream, displayName, videoEnabled, audioEnabled, selectedVideoDevice, selectedAudioDevice, onJoin]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (previewStream) {
      previewStream.getTracks().forEach(track => track.stop());
    }
    onCancel();
  }, [previewStream, onCancel]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" onClick={handleCancel} />
      
      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg">
        <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Join Room</h2>
            <button onClick={handleCancel} className="text-gray-400 hover:text-white p-1 rounded">
              <X size={20} />
            </button>
          </div>
          
          {/* Video Preview */}
          <div className="p-4">
            <div className="relative bg-gray-950 rounded-lg overflow-hidden aspect-video mb-4">
              {videoEnabled && previewStream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <VideoOff className="w-16 h-16 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500">Camera off</p>
                  </div>
                </div>
              )}
              
              {/* Preview controls overlay */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-full ${videoEnabled ? 'bg-gray-700 text-white' : 'bg-red-500/80 text-white'}`}
                >
                  {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                </button>
                <button
                  onClick={toggleAudio}
                  className={`p-3 rounded-full ${audioEnabled ? 'bg-gray-700 text-white' : 'bg-red-500/80 text-white'}`}
                >
                  {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
              </div>
            </div>
            
            {/* Permission Error */}
            {permissionError && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm">{permissionError}</p>
                <button 
                  onClick={initializePreview}
                  className="text-red-300 text-sm underline mt-1"
                >
                  Try again
                </button>
              </div>
            )}
            
            {/* Display Name */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                <User className="inline w-4 h-4 mr-1" />
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name..."
                data-testid="display-name-input"
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            
            {/* Device Selection */}
            {videoDevices.length > 1 && (
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">
                  <Video className="inline w-4 h-4 mr-1" />
                  Camera
                </label>
                <select
                  value={selectedVideoDevice}
                  onChange={(e) => setSelectedVideoDevice(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                >
                  {videoDevices.map((device, index) => (
                    <option key={`video-${index}-${device.deviceId}`} value={device.deviceId}>
                      {device.label || `Camera ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {audioDevices.length > 1 && (
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">
                  <Mic className="inline w-4 h-4 mr-1" />
                  Microphone
                </label>
                <select
                  value={selectedAudioDevice}
                  onChange={(e) => setSelectedAudioDevice(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                >
                  {audioDevices.map((device, index) => (
                    <option key={`audio-${index}-${device.deviceId}`} value={device.deviceId}>
                      {device.label || `Microphone ${index + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Room ID */}
            <p className="text-sm text-gray-500 mb-4">
              Joining room: <span className="font-mono text-gray-400">{roomId.substring(0, 16)}...</span>
            </p>
          </div>
          
          {/* Footer */}
          <div className="flex gap-3 p-4 border-t border-gray-800">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleJoin}
              disabled={isLoading}
              data-testid="join-room-button"
              className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Join Room'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default JoinRoomModal;
