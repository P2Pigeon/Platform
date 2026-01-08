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
 * @file useRoomManager.ts
 * @description Custom hook for managing P2Pigeon room state and logic.
 * 
 * This hook encapsulates the complex logic required for a meeting room, including:
 * - State management for loading, errors, and security configurations.
 * - Asynchronous operations for validating, creating, and joining rooms.
 * - User feedback through toasts.
 * - Navigation and communication context integration.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import meetingService from '../services/meetingService';
import { SecurityLevel, type SecurityConfig } from '../services/meetingService';
import { useCommunication } from '../context/CommunicationContext';
import { ConnectionStatus, CommunicationProtocol } from '../types/core';

// Simple toast helper 
const showToast = (options: { title: string; description?: string; status: 'success' | 'error' | 'info' | 'warning'; duration?: number }) => {
  console.log(`[${options.status.toUpperCase()}] ${options.title}${options.description ? ': ' + options.description : ''}`);
};

/**
 * Defines the props required by the useRoomManager hook.
 */
export interface UseRoomManagerProps {
  roomId: string | undefined;
}

/**
 * Defines the return value of the useRoomManager hook, exposing state and handlers.
 */
export interface JoinSettings {
  displayName: string;
  videoEnabled: boolean;
  audioEnabled: boolean;
  videoDeviceId?: string;
  audioDeviceId?: string;
}

export interface UseRoomManagerReturn {
  isLoading: boolean;
  roomError: string | null;
  promptCreate: boolean;
  securityConfig: SecurityConfig;
  encryptionKey: string | null;
  isSecurityVerified: boolean;
  needsJoinModal: boolean;
  joinError: string | null;
  isHost: boolean;
  handleCreateAndJoin: () => Promise<void>;
  handleJoinWithSettings: (settings: JoinSettings) => Promise<void>;
  handleExitRoom: () => void;
  handleEndMeetingForAll: () => Promise<void>;
  verifySecurity: () => void;
  retryJoin: () => void;
}

/**
 * Custom hook to manage the logic and state for a meeting room.
 * @param {UseRoomManagerProps} props - The properties for the hook, including the room ID.
 * @returns {UseRoomManagerReturn} - The state and handlers for the room.
 */
export const useRoomManager = ({ roomId }: UseRoomManagerProps): UseRoomManagerReturn => {
  const navigate = useNavigate();
  const communication = useCommunication();
  
  // Store context functions in refs to avoid dependency changes
  const joinRoomRef = useRef(communication.joinRoom);
  const startLocalStreamRef = useRef(communication.startLocalStream);
  const leaveRoomRef = useRef(communication.leaveRoom);
  const stopLocalStreamRef = useRef(communication.stopLocalStream);
  const setActiveProtocolRef = useRef(communication.setActiveProtocol);
  const endMeetingRef = useRef(communication.endMeeting);
  
  // Update refs when context changes (but won't trigger effects)
  joinRoomRef.current = communication.joinRoom;
  startLocalStreamRef.current = communication.startLocalStream;
  leaveRoomRef.current = communication.leaveRoom;
  stopLocalStreamRef.current = communication.stopLocalStream;
  setActiveProtocolRef.current = communication.setActiveProtocol;
  endMeetingRef.current = communication.endMeeting;

  const [isLoading, setIsLoading] = useState(true);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [promptCreate, setPromptCreate] = useState(false);
  // Check if this user is the host (created the room from dashboard)
  // Don't remove the flag until the user leaves - this persists across re-renders
  const [creationAttempted, setCreationAttempted] = useState(() => {
    if (roomId) {
      const isHost = sessionStorage.getItem(`host_${roomId}`) === 'true';
      console.log('[RoomManager] Initial host check for room:', roomId, '- isHost:', isHost);
      return isHost;
    }
    return false;
  });

  // Re-check host status when roomId changes (handles lazy loading race condition)
  useEffect(() => {
    if (roomId) {
      const isHost = sessionStorage.getItem(`host_${roomId}`) === 'true';
      console.log('[RoomManager] Host check on roomId change:', roomId, '- isHost:', isHost);
      if (isHost && !creationAttempted) {
        setCreationAttempted(true);
      }
    }
  }, [roomId]);

  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
    level: SecurityLevel.ENHANCED,
    e2eEnabled: true,
    verificationRequired: false,
  });
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [isSecurityVerified, setIsSecurityVerified] = useState(false);
  const [needsJoinModal, setNeedsJoinModal] = useState(true);
  const [joinError, setJoinError] = useState<string | null>(null);
  const hasJoinedRoom = useRef(false);
  const isJoiningRoom = useRef(false);
  const lastJoinAttempt = useRef(0);
  const joinSettingsRef = useRef<JoinSettings | null>(null);

  useEffect(() => {
    async function setupStateFromUrl() {
      // Don't reset state if user has already joined
      if (hasJoinedRoom.current) {
        return;
      }
      
      if (!roomId) {
        setRoomError('Invalid room ID');
        setIsLoading(false);
        return;
      }

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const protocolParam = urlParams.get('protocol');
        
        // Default to WebRTC for now - Hyperswarm browser support is limited
        // WebRTC works peer-to-peer once connection is established
        const useHyperswarm = protocolParam === 'hyperswarm';
        
        if (useHyperswarm) {
          // Hyperswarm - experimental, may not be available
          try {
            setActiveProtocolRef.current(CommunicationProtocol.HYPERSWARM);
            console.log('[RoomManager] Using Hyperswarm protocol - serverless P2P via DHT');
          } catch (err) {
            console.warn('[RoomManager] Hyperswarm not available, falling back to WebRTC');
            setActiveProtocolRef.current(CommunicationProtocol.WEBRTC);
          }
        } else {
          // Default to WebRTC - standard browser WebRTC
          try {
            setActiveProtocolRef.current(CommunicationProtocol.WEBRTC);
            console.log('[RoomManager] Using WebRTC protocol');
          } catch (err) {
            console.error('[RoomManager] Failed to set WebRTC protocol:', err);
          }
        }
        
        // For demo mode, skip backend validation - rooms work P2P
        // In production, you'd validate with a signaling server

        const securityLevel = urlParams.get('security') as SecurityLevel || SecurityLevel.ENHANCED;
        const e2eEncryption = urlParams.get('e2e') !== 'false';
        const verificationRequired = urlParams.get('verify') === 'true';
        const encKey = urlParams.get('key');

        const config: SecurityConfig = {
          level: securityLevel,
          e2eEnabled: e2eEncryption,
          verificationRequired: verificationRequired || securityLevel === SecurityLevel.MAXIMUM,
        };

        setSecurityConfig(config);
        if (encKey) setEncryptionKey(encKey);

      } catch (error) {
        console.error("Error setting up room state:", error);
        setRoomError('Failed to initialize room settings.');
      } finally {
        setIsLoading(false);
      }
    }

    setupStateFromUrl();
  }, [roomId, creationAttempted]);

  // Don't auto-join - wait for user to confirm settings in JoinModal
  // The actual join happens in handleJoinWithSettings

  const handleJoinWithSettings = useCallback(async (settings: JoinSettings) => {
    // Prevent duplicate join attempts with debounce
    const now = Date.now();
    if (!roomId || hasJoinedRoom.current || isJoiningRoom.current) return;
    if (now - lastJoinAttempt.current < 2000) {
      console.log('[RoomManager] Ignoring duplicate join attempt (debounced)');
      return;
    }
    
    lastJoinAttempt.current = now;
    isJoiningRoom.current = true;
    joinSettingsRef.current = settings;
    setNeedsJoinModal(false);
    setJoinError(null);
    
    try {
      console.log('[RoomManager] Joining room with settings:', settings);
      await joinRoomRef.current(roomId);
      hasJoinedRoom.current = true;
      console.log('[RoomManager] Joined room, starting local stream...');
      
      // Start local video/audio stream with user's device preferences
      const stream = await startLocalStreamRef.current(
        settings.audioEnabled ? settings.audioDeviceId : undefined,
        settings.videoEnabled ? settings.videoDeviceId : undefined
      );
      
      // Disable tracks if user chose to join with camera/mic off
      if (stream) {
        if (!settings.videoEnabled) {
          stream.getVideoTracks().forEach(t => t.enabled = false);
        }
        if (!settings.audioEnabled) {
          stream.getAudioTracks().forEach(t => t.enabled = false);
        }
      }
      
      console.log('[RoomManager] Local stream started:', stream?.id);
      showToast({
        title: 'Connected',
        description: 'You have joined the room',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('[RoomManager] Error setting up room:', error);
      isJoiningRoom.current = false;
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect';
      setJoinError(errorMessage);
      // Don't auto-show modal again - let user click retry
      showToast({
        title: 'Connection Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
      });
    }
  }, [roomId]);

  const handleCreateAndJoin = useCallback(async () => {
    if (!roomId) return;
    setCreationAttempted(true);
    
    // Rooms are created dynamically when users join via socket.io
    // No need to call the meeting API - just proceed to join modal
    console.log('[RoomManager] Creating room:', roomId);
    
    // Generate encryption key for E2E encryption
    const encKey = securityConfig.e2eEnabled 
      ? crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
      : null;
    
    setEncryptionKey(encKey);
    setPromptCreate(false);
    
    showToast({
      title: 'Room Ready',
      description: 'Configure your settings to join',
      status: 'info',
      duration: 3000,
    });
  }, [roomId, securityConfig]);

  const handleExitRoom = useCallback(() => {
    // Stop local media stream before leaving
    stopLocalStreamRef.current();
    if (roomId) {
      leaveRoomRef.current(roomId);
      // Clean up host flag on exit
      sessionStorage.removeItem(`host_${roomId}`);
    }
    hasJoinedRoom.current = false; // Reset for potential rejoin
    // Navigate to dashboard
    navigate('/app');
  }, [roomId, navigate]);

  // Handle host ending meeting for all participants
  const handleEndMeetingForAll = useCallback(async () => {
    if (!roomId) return;
    
    // Use endMeeting ref which broadcasts to all peers before leaving
    stopLocalStreamRef.current();
    await endMeetingRef.current(roomId, 'Host ended the meeting');
    sessionStorage.removeItem(`host_${roomId}`);
    hasJoinedRoom.current = false;
    navigate('/app');
  }, [roomId, navigate]);

  const verifySecurity = useCallback(() => {
    setIsSecurityVerified(true);
    showToast({
      title: "Security Verified",
      description: "You've successfully verified the room security.",
      status: "success",
      duration: 3000,
    });
  }, []);

  const retryJoin = useCallback(() => {
    setJoinError(null);
    setNeedsJoinModal(true);
    isJoiningRoom.current = false;
  }, []);

  return {
    isLoading,
    roomError,
    promptCreate,
    securityConfig,
    encryptionKey,
    isSecurityVerified,
    needsJoinModal,
    joinError,
    isHost: creationAttempted,
    handleCreateAndJoin,
    handleJoinWithSettings,
    handleExitRoom,
    handleEndMeetingForAll,
    verifySecurity,
    retryJoin,
  };
};
