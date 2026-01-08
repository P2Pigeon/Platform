/**
 * P2Pigeon - Secure P2P Communication Platform
 * 
 * @license AGPL-3.0 - https://opensource.org/licenses/AGPL-3.0
 * @copyright 2024-2026 P2Pigeon Contributors
 * @see https://github.com/p2pigeon/platform
 * 
 * Last updated: 2026-01-07
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, Home, RotateCcw } from 'lucide-react';

interface MeetingEndedModalProps {
  isOpen: boolean;
  reason?: string;
  roomId?: string;
  duration?: string;
  onClose?: () => void;
}

const MeetingEndedModal: React.FC<MeetingEndedModalProps> = ({
  isOpen,
  reason = 'The host has ended this meeting',
  roomId,
  duration,
  onClose
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleGoHome = () => {
    onClose?.();
    navigate('/app/dashboard');
  };

  const handleRejoin = () => {
    onClose?.();
    if (roomId) {
      // Reload the page to rejoin
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-xl w-full max-w-md mx-4 border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="p-6 text-center border-b border-gray-800">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Meeting Ended</h2>
          <p className="text-gray-400">{reason}</p>
        </div>

        {/* Duration info */}
        {duration && (
          <div className="px-6 py-4 border-b border-gray-800">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Duration</span>
              <span className="text-white font-mono">{duration}</span>
            </div>
            {roomId && (
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-gray-500">Room</span>
                <span className="text-gray-300 font-mono truncate max-w-[200px]">{roomId}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="p-6 flex gap-3">
          <button
            onClick={handleGoHome}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </button>
          {roomId && (
            <button
              onClick={handleRejoin}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
              title="Rejoin meeting"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetingEndedModal;
