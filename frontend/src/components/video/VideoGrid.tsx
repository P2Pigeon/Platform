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
 * @file VideoGrid.tsx
 * @description Video grid component - optimized for low latency
 */

import React, { useEffect, useRef, useCallback, memo } from 'react';
import { User, VideoOff, MicOff, Loader2 } from 'lucide-react';
import { useCommunication } from '../../context/CommunicationContext';

interface VideoGridProps {
  securityConfig?: any;
  encryptionKey?: string | null;
}

const VideoGrid: React.FC<VideoGridProps> = () => {
  const { participants = {}, streams = {}, connectionStatus, localStream } = useCommunication();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const isConnecting = connectionStatus === 'connecting';

  // Attach stream directly to video element when ref is available
  const attachLocalStream = useCallback((videoElement: HTMLVideoElement | null) => {
    if (videoElement && localStream && videoElement.srcObject !== localStream) {
      videoElement.srcObject = localStream;
      videoElement.play().catch(err => console.error('Error playing local video:', err));
    }
  }, [localStream]);

  // Effect to handle stream attachment
  useEffect(() => {
    attachLocalStream(localVideoRef.current);
  }, [attachLocalStream]);

  // Build participant list
  const allParticipants: any[] = [];
  Object.values(participants).forEach(roomParticipants => {
    Object.values(roomParticipants).forEach(participant => allParticipants.push(participant));
  });

  const getGridCols = () => {
    const count = allParticipants.length + (localStream ? 1 : 0);
    if (count <= 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    return 'grid-cols-2 lg:grid-cols-3';
  };

  const hasContent = localStream || allParticipants.length > 0;

  return (
    <div className={`grid ${getGridCols()} gap-2 p-2 h-full w-full`}>
      {isConnecting && !hasContent ? (
        <div className="col-span-full flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <Loader2 className="w-10 h-10 text-gray-400 animate-spin mx-auto" />
            <p className="text-gray-400">Connecting...</p>
          </div>
        </div>
      ) : !hasContent ? (
        <div className="col-span-full flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <User className="w-16 h-16 text-gray-500 mx-auto" />
            <p className="text-gray-400">Waiting for video...</p>
            <p className="text-gray-500 text-sm">Camera access may be required</p>
          </div>
        </div>
      ) : (
        <>
          {/* Local video */}
          {localStream && (
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                disablePictureInPicture
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)', willChange: 'transform' }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
                <span className="text-white text-sm">You</span>
              </div>
            </div>
          )}
          
          {/* Remote participants */}
          {allParticipants.map((participant) => (
            <div key={participant.id} className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
              {streams[participant.id] ? (
                <video
                  ref={(el) => {
                    if (el && streams[participant.id] && el.srcObject !== streams[participant.id]) {
                      el.srcObject = streams[participant.id];
                      el.play().catch(err => console.error('Error playing remote video:', err));
                    }
                  }}
                  autoPlay
                  playsInline
                  disablePictureInPicture
                  className="w-full h-full object-cover"
                  style={{ willChange: 'contents' }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <VideoOff className="w-12 h-12 text-gray-600" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 flex justify-between items-center">
                <span className="text-white text-sm">{participant.displayName || `User ${participant.id.substring(0, 4)}`}</span>
                {participant.audio === false && <MicOff className="w-4 h-4 text-red-400" />}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default memo(VideoGrid);
