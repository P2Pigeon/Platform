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
 * @file ShareRoomModal.tsx
 * @description Modal to share room URL with QR code
 */

import React, { useCallback, useState, useEffect } from 'react';
import { X, Copy, Mail, Check, Smartphone, Download } from 'lucide-react';

interface ShareRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

const ShareRoomModal: React.FC<ShareRoomModalProps> = ({ isOpen, onClose, roomId }) => {
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  
  // Production domain
  const roomUrl = `https://pigeon.cx/join/${roomId}`;

  // Generate QR code - standard black on white
  useEffect(() => {
    if (!isOpen || !roomId) return;
    
    // Standard black QR on white background
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(roomUrl)}&bgcolor=ffffff&color=000000&format=png`;
    setQrCodeUrl(qrApiUrl);
  }, [isOpen, roomId, roomUrl]);

  const copyUrl = useCallback(() => {
    navigator.clipboard.writeText(roomUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [roomUrl]);

  const emailInvite = useCallback(() => {
    const subject = encodeURIComponent('Join my Pigeon video call');
    const body = encodeURIComponent(`Join my secure P2P video call:\n\n${roomUrl}\n\nNo account needed - just click the link to join!`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }, [roomUrl]);

  const downloadQrCode = useCallback(() => {
    if (!qrCodeUrl) return;
    
    // Fetch and download the QR code
    fetch(qrCodeUrl)
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pigeon-room-${roomId}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
  }, [qrCodeUrl, roomId]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
        <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-2xl p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
          
          {/* Header */}
          <h2 className="text-xl font-semibold text-white text-center mb-6">
            Share the room
          </h2>
          
          {/* QR Code */}
          <div className="flex flex-col items-center mb-4">
            <div className="bg-white p-3 rounded-lg mb-3">
              {qrCodeUrl ? (
                <img 
                  src={qrCodeUrl} 
                  alt="Room QR Code" 
                  className="w-48 h-48"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center bg-gray-100">
                  <div className="animate-spin w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
            <button
              onClick={downloadQrCode}
              className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <Download size={14} />
              Download QR Code
            </button>
          </div>
          
          {/* Mobile instruction */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 text-cyan-400 mb-2">
              <Smartphone size={18} />
              <span className="font-medium">Join from any device</span>
            </div>
            <p className="text-gray-400 text-sm">
              Scan the QR code with your camera or share the link below.
            </p>
          </div>
          
          {/* URL display */}
          <div className="bg-gray-800 rounded-lg px-4 py-3 mb-6">
            <p className="text-cyan-400 text-sm break-all font-mono">{roomUrl}</p>
          </div>
          
          {/* Action buttons */}
          <div className="flex justify-center gap-3">
            <button
              onClick={copyUrl}
              className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${
                copied 
                  ? 'bg-green-600 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy URL'}
            </button>
            
            <button
              onClick={emailInvite}
              className="px-4 py-2 rounded-lg font-medium text-sm bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-2 transition-colors"
            >
              <Mail size={16} />
              Email invite
            </button>
            
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium text-sm bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShareRoomModal;
