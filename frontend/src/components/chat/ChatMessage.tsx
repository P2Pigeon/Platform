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
 * @file ChatMessage.tsx
 * @description Renders a single chat message.
 */

import React from 'react';

interface ChatMessageProps {
  sender: string;
  message: string;
  isMe: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ sender, message, isMe }) => {
  return (
    <div className={isMe ? 'self-end' : 'self-start'}>
      <div className={`${isMe ? 'bg-cyan-500 text-white' : 'bg-gray-200 text-black'} rounded-lg p-3 max-w-md`}>
        <p className="font-bold text-sm mb-1">{sender}</p>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
