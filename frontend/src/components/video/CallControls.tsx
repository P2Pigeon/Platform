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
 * @file CallControls.tsx
 * @description This component provides the user with controls for the call (e.g., mute, hang up).
 */

import React, { useCallback, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Monitor, MonitorOff, MessageSquare, PenTool, Link, Check, Minimize2, Maximize2, Settings, Users, Share2, XCircle } from 'lucide-react';
import { useCommunication } from '../../context/CommunicationContext';
import type { VideoQuality } from '../../services/protocols/WebRTCAdapter';

// Video quality options from MiroTalk
const VIDEO_QUALITY_OPTIONS: { value: VideoQuality; label: string; resolution: string }[] = [
  { value: 'qvgaVideo', label: 'Low', resolution: '320×240' },
  { value: 'vgaVideo', label: 'SD', resolution: '640×480' },
  { value: 'hdVideo', label: 'HD', resolution: '1280×720' },
  { value: 'fhdVideo', label: 'Full HD', resolution: '1920×1080' },
  { value: '2kVideo', label: '2K', resolution: '2560×1440' },
  { value: '4kVideo', label: '4K', resolution: '3840×2160' },
  { value: '6kVideo', label: '6K', resolution: '6144×3456' },
  { value: '8kVideo', label: '8K', resolution: '7680×4320' },
];

interface CallControlsProps {
  onToggleChat: () => void;
  onToggleWhiteboard: () => void;
  onToggleParticipants: () => void;
  onShareRoom: () => void;
  onLeave: () => void;
  onEndMeeting?: () => void;
  onToggleMinimize?: () => void;
  isMinimized?: boolean;
  isHost?: boolean;
  roomId?: string;
  participantCount?: number;
}

const CallControls: React.FC<CallControlsProps> = ({ onToggleChat, onToggleWhiteboard, onToggleParticipants, onShareRoom, onLeave, onEndMeeting, onToggleMinimize, isMinimized, isHost = false, roomId, participantCount = 1 }) => {
  const { getLocalStream, protocolManager } = useCommunication();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [videoQuality, setVideoQuality] = useState<VideoQuality>('hdVideo');

  const copyRoomLink = useCallback(() => {
    const url = `${window.location.origin}/app/join/${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }, [roomId]);

  const handleQualityChange = useCallback(async (quality: VideoQuality) => {
    setVideoQuality(quality);
    setShowQualityMenu(false);
    // Apply to WebRTC adapter via protocol manager
    const adapter = protocolManager.getActiveAdapter();
    if (adapter && 'setVideoQuality' in adapter) {
      await (adapter as any).setVideoQuality(quality);
    }
  }, [protocolManager]);
  
  const onToggleMute = useCallback(() => {
    const stream = getLocalStream();
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  }, [getLocalStream, isMuted]);

  const onToggleVideo = useCallback(() => {
    const stream = getLocalStream();
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
    }
    setIsVideoEnabled(!isVideoEnabled);
  }, [getLocalStream, isVideoEnabled]);

  const onToggleScreenShare = useCallback(async () => {
    try {
      const localStream = getLocalStream();
      if (!localStream) {
        console.warn('No local stream available for screen share');
        return;
      }

      if (isScreenSharing) {
        // Stop screen sharing - switch back to camera
        // Re-enable camera by getting a new camera stream
        try {
          const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const cameraTrack = cameraStream.getVideoTracks()[0];
          
          // Replace the screen share track with camera track in local stream
          const oldTrack = localStream.getVideoTracks()[0];
          if (oldTrack) {
            localStream.removeTrack(oldTrack);
            oldTrack.stop();
          }
          localStream.addTrack(cameraTrack);
          
          // Update peer connections
          const adapter = protocolManager.getActiveAdapter();
          if (adapter && 'replaceVideoTrack' in adapter) {
            await (adapter as any).replaceVideoTrack(cameraTrack);
          }
        } catch (err) {
          console.error('Error switching back to camera:', err);
        }
        setIsScreenSharing(false);
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' } as any,
          audio: false
        });
        
        const screenTrack = screenStream.getVideoTracks()[0];
        
        // Replace the camera track with screen share track in local stream
        const cameraTrack = localStream.getVideoTracks()[0];
        if (cameraTrack) {
          localStream.removeTrack(cameraTrack);
          // Don't stop the camera track - we need it to switch back
        }
        localStream.addTrack(screenTrack);
        
        // Replace video track in peer connections
        const adapter = protocolManager.getActiveAdapter();
        if (adapter && 'replaceVideoTrack' in adapter) {
          await (adapter as any).replaceVideoTrack(screenTrack);
        }
        
        // Handle when user stops sharing via browser UI
        screenTrack.onended = async () => {
          setIsScreenSharing(false);
          // Switch back to camera
          try {
            const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
            const newCameraTrack = cameraStream.getVideoTracks()[0];
            
            const currentScreenTrack = localStream.getVideoTracks()[0];
            if (currentScreenTrack) {
              localStream.removeTrack(currentScreenTrack);
            }
            localStream.addTrack(newCameraTrack);
            
            if (adapter && 'replaceVideoTrack' in adapter) {
              await (adapter as any).replaceVideoTrack(newCameraTrack);
            }
          } catch (err) {
            console.error('Error restoring camera after screen share:', err);
          }
        };
        
        setIsScreenSharing(true);
      }
    } catch (err) {
      console.error('Screen share error:', err);
      setIsScreenSharing(false);
    }
  }, [isScreenSharing, protocolManager, getLocalStream]);

  const btnBase = "p-3 rounded-lg transition-colors duration-150 hover:bg-gray-700";
  
  return (
    <div className="p-4 bg-gray-900">
      <div className="flex justify-center items-center gap-3">
        <button
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          onClick={onToggleMute}
          className={`${btnBase} ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-white'}`}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <button
          aria-label={isVideoEnabled ? 'Turn off video' : 'Turn on video'}
          onClick={onToggleVideo}
          className={`${btnBase} ${isVideoEnabled ? 'bg-gray-800 text-white' : 'bg-red-500/20 text-red-400'}`}
        >
          {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
        <button
          aria-label={isScreenSharing ? 'Stop Screen Share' : 'Screen Share'}
          onClick={onToggleScreenShare}
          className={`${btnBase} ${isScreenSharing ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-white'}`}
        >
          {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
        </button>
        <button
          aria-label="Chat"
          onClick={onToggleChat}
          className={`${btnBase} bg-gray-800 text-white`}
        >
          <MessageSquare size={20} />
        </button>
        <button
          aria-label="Whiteboard"
          onClick={onToggleWhiteboard}
          className={`${btnBase} bg-gray-800 text-white`}
        >
          <PenTool size={20} />
        </button>
        <button
          aria-label="Participants"
          onClick={onToggleParticipants}
          className={`${btnBase} bg-gray-800 text-white relative`}
        >
          <Users size={20} />
          {participantCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
              {participantCount}
            </span>
          )}
        </button>
        {roomId && (
          <button
            aria-label="Share Room"
            onClick={onShareRoom}
            className={`${btnBase} bg-gray-800 text-white`}
          >
            <Share2 size={20} />
          </button>
        )}
        {onToggleMinimize && (
          <button
            aria-label={isMinimized ? "Maximize call" : "Minimize call"}
            onClick={onToggleMinimize}
            className={`${btnBase} bg-gray-800 text-white`}
          >
            {isMinimized ? <Maximize2 size={20} /> : <Minimize2 size={20} />}
          </button>
        )}
        
        {/* Video Quality Selector */}
        <div className="relative">
          <button
            aria-label="Video quality settings"
            onClick={() => setShowQualityMenu(!showQualityMenu)}
            className={`${btnBase} bg-gray-800 text-white`}
          >
            <Settings size={20} />
          </button>
          {showQualityMenu && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 min-w-[160px] z-50">
              <div className="px-3 py-1 text-xs text-gray-400 border-b border-gray-700 mb-1">Video Quality</div>
              {VIDEO_QUALITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleQualityChange(option.value)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex justify-between items-center ${
                    videoQuality === option.value ? 'text-cyan-400 bg-gray-700/50' : 'text-white'
                  }`}
                >
                  <span>{option.label}</span>
                  <span className="text-xs text-gray-500">{option.resolution}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Leave button for non-hosts */}
        {!isHost && (
          <button
            onClick={onLeave}
            aria-label="Leave meeting"
            className={`${btnBase} bg-red-600 text-white hover:bg-red-700`}
          >
            <PhoneOff size={20} />
          </button>
        )}
        
        {/* End Meeting button for host */}
        {isHost && onEndMeeting && (
          <button
            onClick={onEndMeeting}
            aria-label="End meeting for all"
            className={`${btnBase} bg-red-600 text-white hover:bg-red-700 flex items-center gap-2 px-4`}
          >
            <XCircle size={20} />
            <span className="text-sm font-medium">End</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default CallControls;
