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
 * @file ParticipantsPanel.tsx
 * @description Panel showing current call participants
 */

import React from 'react';
import { X, Mic, MicOff, Video, VideoOff, User, UserX, Volume2, VolumeX } from 'lucide-react';
import { useCommunication } from '../../context/CommunicationContext';

interface ParticipantsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  hasOtherPanel?: boolean;
  isHost?: boolean;
  onMuteParticipant?: (participantId: string, muted: boolean) => void;
  onKickParticipant?: (participantId: string) => void;
}

const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({ 
  isOpen, 
  onClose, 
  hasOtherPanel = false,
  isHost = false,
  onMuteParticipant,
  onKickParticipant
}) => {
  const { participants = {}, getLocalStream } = useCommunication();
  
  const localStream = getLocalStream();
  const hasLocalVideo = localStream?.getVideoTracks().some(t => t.enabled) ?? false;
  const hasLocalAudio = localStream?.getAudioTracks().some(t => t.enabled) ?? false;

  // Flatten participants from all rooms
  const allParticipants: any[] = [];
  Object.values(participants).forEach(roomParticipants => {
    Object.values(roomParticipants).forEach(participant => allParticipants.push(participant));
  });

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-0 bottom-0 w-full md:w-72 bg-gray-900 border-l border-gray-800 flex flex-col z-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h3 className="text-white font-medium">Participants ({allParticipants.length + 1})</h3>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800"
        >
          <X size={18} />
        </button>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Local user (You) */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 mb-2">
          <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center">
            <User size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">You (Host)</p>
            <p className="text-gray-400 text-xs">Local</p>
          </div>
          <div className="flex items-center gap-1">
            {hasLocalAudio ? (
              <Mic size={16} className="text-green-400" />
            ) : (
              <MicOff size={16} className="text-red-400" />
            )}
            {hasLocalVideo ? (
              <Video size={16} className="text-green-400" />
            ) : (
              <VideoOff size={16} className="text-red-400" />
            )}
          </div>
        </div>

        {/* Remote participants */}
        {allParticipants.map((participant) => {
          const isMuted = participant.mutedByHost === true;
          
          return (
            <div 
              key={participant.id} 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/30 mb-1 group"
            >
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                <User size={20} className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {participant.displayName || `User ${participant.id.substring(0, 6)}`}
                </p>
                <p className="text-gray-400 text-xs">
                  {isMuted ? 'Muted by host' : 'Connected'}
                </p>
              </div>
              
              {/* Status indicators */}
              <div className="flex items-center gap-1">
                {participant.audio !== false && !isMuted ? (
                  <Mic size={16} className="text-green-400" />
                ) : (
                  <MicOff size={16} className="text-red-400" />
                )}
                {participant.video !== false ? (
                  <Video size={16} className="text-green-400" />
                ) : (
                  <VideoOff size={16} className="text-red-400" />
                )}
              </div>
              
              {/* Host controls */}
              {isHost && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onMuteParticipant?.(participant.id, !isMuted)}
                    className={`p-1.5 rounded hover:bg-gray-700 ${isMuted ? 'text-red-400' : 'text-gray-400 hover:text-white'}`}
                    title={isMuted ? 'Unmute participant' : 'Mute participant'}
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <button
                    onClick={() => onKickParticipant?.(participant.id)}
                    className="p-1.5 rounded text-gray-400 hover:text-red-400 hover:bg-gray-700"
                    title="Remove from meeting"
                  >
                    <UserX size={16} />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {allParticipants.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No other participants yet</p>
            <p className="text-xs mt-1">Share the room link to invite others</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantsPanel;
