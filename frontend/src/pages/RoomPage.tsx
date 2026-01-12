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
 * @file RoomPage.tsx
 * @description Main container for the secure video call interface.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Shield, AlertTriangle, Info, Home, PlusCircle, Plus, X, Loader2, Maximize2, RefreshCw } from 'lucide-react';
import VideoGrid from '../components/video/VideoGrid';
import CallControls from '../components/video/CallControls';
import ChatPanel from '../components/chat/ChatPanel';
import ParticipantsPanel from '../components/video/ParticipantsPanel';
import ShareRoomModal from '../components/video/ShareRoomModal';
import JoinRoomModal from '../components/video/JoinRoomModal';
import MeetingEndedModal from '../components/video/MeetingEndedModal';
import Whiteboard from '../components/whiteboard/Whiteboard';
import type { JoinSettings } from '../components/video/JoinRoomModal';
import { useRoomManager } from '../hooks/useRoomManager';
import { SecurityLevel } from '../services/meetingService';
import { useCommunication } from '../context/CommunicationContext';
import type { PeerId } from '../types/core';

const RoomPage: React.FC = () => {
  const { roomId } = useParams<'roomId'>();
  const navigate = useNavigate();
  const { muteParticipant, kickParticipant, protocolManager } = useCommunication();
  const { isLoading, roomError, promptCreate, securityConfig, encryptionKey, isSecurityVerified, needsJoinModal, joinError, isHost, handleCreateAndJoin, handleJoinWithSettings, handleExitRoom, handleEndMeetingForAll, verifySecurity, retryJoin } = useRoomManager({ roomId });
  const [meetingEndedInfo, setMeetingEndedInfo] = useState<{ show: boolean; reason?: string; duration?: string } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isSecurityInfoOpen, setIsSecurityInfoOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  
  // Minimized window position and size
  const [windowPos, setWindowPos] = useState({ x: window.innerWidth - 340, y: window.innerHeight - 220 });
  const [windowSize, setWindowSize] = useState({ width: 320, height: 200 });
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const [notification, setNotification] = useState<{ type: 'success' | 'warning' | 'info'; message: string } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [hasShownShareModal, setHasShownShareModal] = useState(false);
  const meetingStartTime = useRef<number | null>(null);
  
  // Mobile: opening one panel closes others
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  const handleToggleChat = () => {
    if (isMobile && !isChatOpen) {
      setIsParticipantsOpen(false);
      setIsWhiteboardOpen(false);
    }
    setIsChatOpen(!isChatOpen);
  };
  
  const handleToggleParticipants = () => {
    if (isMobile && !isParticipantsOpen) {
      setIsChatOpen(false);
      setIsWhiteboardOpen(false);
    }
    setIsParticipantsOpen(!isParticipantsOpen);
  };
  
  const handleToggleWhiteboard = () => {
    if (isMobile && !isWhiteboardOpen) {
      setIsChatOpen(false);
      setIsParticipantsOpen(false);
    }
    setIsWhiteboardOpen(!isWhiteboardOpen);
  };

  // Show share modal AFTER user joins (not when needsJoinModal is true)
  useEffect(() => {
    if (!isLoading && !roomError && !promptCreate && roomId && !needsJoinModal && !hasShownShareModal) {
      setShowShareModal(true);
      setHasShownShareModal(true);
      // Start tracking meeting time when joined
      meetingStartTime.current = Date.now();
    }
  }, [isLoading, roomError, promptCreate, roomId, needsJoinModal, hasShownShareModal]);

  // Listen for meeting ended events from other participants (when host ends meeting)
  useEffect(() => {
    const adapter = protocolManager.getActiveAdapter();
    if (!adapter) return;

    const handleMeetingEnded = (data: { endedBy: string; reason: string }) => {
      const elapsed = meetingStartTime.current ? Date.now() - meetingStartTime.current : 0;
      setMeetingEndedInfo({
        show: true,
        reason: data.reason,
        duration: formatDuration(elapsed)
      });
    };

    // Subscribe to meeting ended event
    if ('on' in adapter) {
      (adapter as any).on('onMeetingEnded', handleMeetingEnded);
    }

    return () => {
      if ('off' in adapter) {
        (adapter as any).off('onMeetingEnded', handleMeetingEnded);
      }
    };
  }, [protocolManager]);

  // Format duration as HH:MM:SS or MM:SS
  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Drag handlers for minimized window
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragOffset.current = { x: e.clientX - windowPos.x, y: e.clientY - windowPos.y };
    e.preventDefault();
  }, [windowPos]);

  const handleDrag = useCallback((e: MouseEvent) => {
    if (isDragging.current) {
      const newX = Math.max(0, Math.min(window.innerWidth - windowSize.width, e.clientX - dragOffset.current.x));
      const newY = Math.max(0, Math.min(window.innerHeight - windowSize.height, e.clientY - dragOffset.current.y));
      setWindowPos({ x: newX, y: newY });
    }
    if (isResizing.current) {
      const newWidth = Math.max(200, resizeStart.current.width + (e.clientX - resizeStart.current.x));
      const newHeight = Math.max(150, resizeStart.current.height + (e.clientY - resizeStart.current.y));
      setWindowSize({ width: newWidth, height: newHeight });
    }
  }, [windowSize.width, windowSize.height]);

  const handleDragEnd = useCallback(() => {
    isDragging.current = false;
    isResizing.current = false;
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    isResizing.current = true;
    resizeStart.current = { x: e.clientX, y: e.clientY, width: windowSize.width, height: windowSize.height };
    e.preventDefault();
    e.stopPropagation();
  }, [windowSize]);

  // Mouse event listeners for drag/resize
  useEffect(() => {
    if (isMinimized) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isMinimized, handleDrag, handleDragEnd]);

  // Handle user leaving meeting - store state and navigate to dashboard
  const handleLeaveMeeting = () => {
    const elapsed = meetingStartTime.current ? Date.now() - meetingStartTime.current : 0;
    // Store meeting state for dashboard modal
    sessionStorage.setItem('meetingState', JSON.stringify({
      type: 'left', // User chose to leave
      roomId: roomId,
      duration: formatDuration(elapsed)
    }));
    handleExitRoom();
  };

  // Handle host ending meeting - broadcasts to all participants then exits
  const handleEndMeeting = async () => {
    const elapsed = meetingStartTime.current ? Date.now() - meetingStartTime.current : 0;
    sessionStorage.setItem('meetingState', JSON.stringify({
      type: 'ended', // Host ended meeting
      roomId: roomId,
      duration: formatDuration(elapsed)
    }));
    // This broadcasts meeting_ended to all peers before leaving
    await handleEndMeetingForAll();
  };

  const handleJoin = (settings: JoinSettings) => {
    handleJoinWithSettings(settings);
  };

  const handleCancelJoin = () => {
    navigate('/app/dashboard');
  };

  // Host controls for participants - sends commands via WebRTC data channel
  const handleMuteParticipant = (participantId: string, muted: boolean) => {
    muteParticipant(participantId as PeerId, muted);
    showNotification('info', `Participant ${muted ? 'muted' : 'unmuted'}`);
  };

  const handleKickParticipant = (participantId: string) => {
    kickParticipant(participantId as PeerId);
    showNotification('warning', 'Participant removed from meeting');
  };

  const showNotification = (type: 'success' | 'warning' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const getSecurityBadgeColor = () => {
    if (securityConfig.level === SecurityLevel.MAXIMUM) return 'bg-green-600 border-green-400';
    if (securityConfig.level === SecurityLevel.ENHANCED) return 'bg-blue-600 border-blue-400';
    return 'bg-yellow-600 border-yellow-400';
  };

  if (promptCreate) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-150px)] w-full p-4">
        <div className="bg-gray-800 p-10 rounded-lg shadow-xl max-w-md w-full text-center space-y-6">
          <PlusCircle className="w-16 h-16 text-cyan-400 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Room Not Found</h2>
          <p className="text-gray-300">The room "{roomId}" does not exist. Would you like to create it?</p>
          <div className="flex gap-4 justify-center">
            <button onClick={handleCreateAndJoin} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create and Join Room
            </button>
            <button onClick={() => navigate('/app')} className="px-4 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700">Return to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  if (roomError) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-150px)] w-full p-4">
        <div className="bg-gray-800 p-10 rounded-lg shadow-xl max-w-md w-full text-center space-y-6">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Room Error</h2>
          <p className="text-gray-300">{roomError}</p>
          <button onClick={() => navigate('/app')} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 mx-auto">
            <Home className="w-4 h-4" /> Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto" />
          <p className="text-white">Setting up secure room...</p>
        </div>
      </div>
    );
  }

  // Connection error state - show retry option
  if (joinError) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-150px)] w-full p-4">
        <div className="bg-gray-800 p-10 rounded-lg shadow-xl max-w-md w-full text-center space-y-6">
          <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Connection Failed</h2>
          <p className="text-gray-300">{joinError}</p>
          <p className="text-gray-400 text-sm">The signaling server may be unavailable. Please check if the server is running on port 3060.</p>
          <div className="flex gap-4 justify-center">
            <button onClick={retryJoin} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700">
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
            <button onClick={() => navigate('/app')} className="px-4 py-2 border border-gray-600 text-gray-300 rounded hover:bg-gray-700">Return to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  // Minimized floating view - draggable and resizable
  if (isMinimized) {
    return (
      <div 
        className="fixed z-50 bg-gray-900 rounded-lg overflow-hidden"
        style={{ 
          left: windowPos.x, 
          top: windowPos.y, 
          width: windowSize.width, 
          height: windowSize.height 
        }}
      >
        {/* Draggable header */}
        <div 
          className="p-2 bg-gray-800 flex items-center justify-between cursor-move select-none"
          onMouseDown={handleDragStart}
        >
          <span className="text-xs text-gray-300 font-mono truncate">🔒 {roomId?.substring(0, 12)}...</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setIsMinimized(false)} className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded" title="Maximize">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button onClick={handleExitRoom} className="p-1 text-red-400 hover:bg-red-900/50 rounded" title="End call">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Video content */}
        <div className="bg-gray-950" style={{ height: windowSize.height - 36 }}>
          <VideoGrid securityConfig={securityConfig} encryptionKey={encryptionKey} />
        </div>
        {/* Resize handle - bottom right corner */}
        <div 
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeStart}
        >
          <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] p-4">
      <div className="flex flex-col h-full w-full bg-gray-950 overflow-hidden rounded-xl border border-white/10">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-md ${notification.type === 'success' ? 'bg-green-900/90 text-green-300' : notification.type === 'warning' ? 'bg-yellow-900/90 text-yellow-300' : 'bg-blue-900/90 text-blue-300'}`}>{notification.message}</div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center p-3 bg-gray-900">
        <h1 className="text-sm font-medium text-gray-300 font-mono truncate">Room: {roomId}</h1>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        <div className="flex-1 relative h-full"><VideoGrid securityConfig={securityConfig} encryptionKey={encryptionKey} /></div>
        {/* Side panels - positioned relative on desktop for side-by-side layout */}
        <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} hasOtherPanel={isParticipantsOpen} roomId={roomId} />
        <ParticipantsPanel 
          isOpen={isParticipantsOpen} 
          onClose={() => setIsParticipantsOpen(false)} 
          hasOtherPanel={isChatOpen}
          isHost={isHost}
          onMuteParticipant={handleMuteParticipant}
          onKickParticipant={handleKickParticipant}
        />
        <Whiteboard isOpen={isWhiteboardOpen} onClose={() => setIsWhiteboardOpen(false)} />
      </div>
      
      {/* Footer */}
      <div className="bg-gray-900">
        <CallControls 
          onToggleChat={handleToggleChat} 
          onToggleWhiteboard={handleToggleWhiteboard} 
          onToggleParticipants={handleToggleParticipants}
          onShareRoom={() => setShowShareModal(true)}
          onLeave={handleLeaveMeeting}
          onEndMeeting={handleEndMeeting}
          onToggleMinimize={() => setIsMinimized(!isMinimized)}
          isMinimized={isMinimized}
          isHost={isHost}
          roomId={roomId}
          participantCount={1}
        />
      </div>
      
      {/* Security Modal */}
      {isSecurityInfoOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { if (!securityConfig.verificationRequired || isSecurityVerified) setIsSecurityInfoOpen(false); else showNotification('warning', 'You must verify security settings to continue.'); }}>
          <div className="bg-gray-800 rounded-lg w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center gap-2 text-white"><Shield className="w-5 h-5" /> Room Security Information</div>
              <button onClick={() => { if (!securityConfig.verificationRequired || isSecurityVerified) setIsSecurityInfoOpen(false); }} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-4 text-gray-300">
              <div><p className="font-bold text-white">Security Level:</p><p>{securityConfig.level}</p></div>
              <div><p className="font-bold text-white">End-to-End Encryption:</p><p>{securityConfig.e2eEnabled ? 'Enabled' : 'Disabled'}</p></div>
              <div><p className="font-bold text-white">Peer Verification:</p><p>{securityConfig.verificationRequired ? 'Required' : 'Optional'}</p></div>
              {encryptionKey && (
                <div><p className="font-bold text-white">Encryption Key:</p><p className="text-sm font-mono p-2 bg-gray-900 rounded-md">{encryptionKey.substring(0, 20)}...{encryptionKey.substring(encryptionKey.length - 10)}</p><p className="text-xs mt-1">Share this key securely with participants if needed.</p></div>
              )}
            </div>
            <div className="flex justify-end p-4 border-t border-gray-700">
              {securityConfig.verificationRequired && !isSecurityVerified ? (
                <button onClick={() => { verifySecurity(); setIsSecurityInfoOpen(false); showNotification('success', 'You have manually verified the security of this room.'); }} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Verify Security Settings</button>
              ) : (
                <button onClick={() => setIsSecurityInfoOpen(false)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Close</button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Share Room Modal */}
      <ShareRoomModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
        roomId={roomId || ''} 
      />
      
      {/* Join Room Modal - shown before entering room */}
      <JoinRoomModal
        isOpen={needsJoinModal && !isLoading && !roomError && !promptCreate}
        onJoin={handleJoin}
        onCancel={handleCancelJoin}
        roomId={roomId || ''}
      />
      
      {/* Meeting Ended Modal - shown when host ends meeting */}
      <MeetingEndedModal
        isOpen={meetingEndedInfo?.show || false}
        reason={meetingEndedInfo?.reason}
        roomId={roomId}
        duration={meetingEndedInfo?.duration}
        onClose={() => setMeetingEndedInfo(null)}
      />
      </div>
    </div>
  );
};

export default RoomPage;
