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
 * @file DataRoomParticipant.tsx
 * @description A component that renders information about a single participant in a data room.
 * 
 * This component is responsible for displaying the participant's avatar, display name, connection status,
 * and whether they are the host or the local user.
 * 
 * @module Components/DataRoomParticipant
 */
import React from 'react';
import { Circle } from 'lucide-react';
import { Peer, ConnectionStatus } from '../types/core';

/**
 * @interface DataRoomParticipantProps
 * @description Props for the DataRoomParticipant component.
 */
interface DataRoomParticipantProps {
  participant: Peer;
  isHost?: boolean;
}

/**
 * @component DataRoomParticipant
 * @description Renders the UI for a single participant in a data room.
 */
export const DataRoomParticipant: React.FC<DataRoomParticipantProps> = ({ 
  participant,
  isHost = false
}) => {
  const getStatusColor = (status: ConnectionStatus): string => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return 'text-green-500';
      case ConnectionStatus.CONNECTING:
        return 'text-yellow-500';
      case ConnectionStatus.DISCONNECTED:
        return 'text-gray-500';
      case ConnectionStatus.ERROR:
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const statusColor = getStatusColor(participant.connectionStatus);
  const initials = (participant.displayName || 'AU').substring(0, 2).toUpperCase();
  
  return (
    <div className="flex items-center gap-3 p-2 rounded-md bg-white/10">
      <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white text-sm font-medium">
        {participant.avatarUrl ? (
          <img src={participant.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          initials
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {participant.displayName || (participant.isLocal ? 'You' : 'Anonymous User')}
          </span>
          {isHost && (
            <span className="px-1.5 py-0.5 text-xs bg-cyan-500 text-white rounded">
              Host
            </span>
          )}
          {participant.isLocal && (
            <span className="px-1.5 py-0.5 text-xs border border-gray-500 text-gray-400 rounded">
              You
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Circle className={`w-2 h-2 fill-current ${statusColor}`} />
          <span>
            {participant.connectionStatus === ConnectionStatus.CONNECTED ? 'Connected' : participant.connectionStatus}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DataRoomParticipant;
