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
 * @file Topbar.tsx
 * @description Premium glassmorphism top navigation bar
 */

import React from 'react';
import { Menu, User, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopbarProps {
  onOpen: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ onOpen }) => {
  const { status, publicIdentity } = useAuth();

  const displayName =
    status === 'guest'
      ? 'Guest'
      : publicIdentity?.publicKey
      ? `${publicIdentity.publicKey.substring(0, 8)}...`
      : 'User';

  const isAuthenticated = status !== 'guest';

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-pigeon-bg-elevated/50 backdrop-blur-xl border-b border-white/5">
      {/* Mobile: Logo on left */}
      <div className="md:hidden flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-pigeon-text">P2Pigeon</span>
      </div>

      {/* Mobile: Hamburger on right */}
      <button
        className="md:hidden p-2 rounded-lg text-pigeon-text-muted hover:text-pigeon-text hover:bg-white/5 transition-all"
        onClick={onOpen}
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop: User info (hidden on mobile) */}
      <div className="hidden md:flex items-center gap-4 ml-auto">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-semibold ${
            isAuthenticated ? 'bg-gradient-primary shadow-glow' : 'bg-pigeon-surface'
          }`}>
            {isAuthenticated ? displayName[0].toUpperCase() : <User className="w-4 h-4 text-pigeon-text-muted" />}
          </div>
          <div>
            <p className="text-sm font-medium text-pigeon-text">{displayName}</p>
            <p className="text-xs text-pigeon-text-muted">{isAuthenticated ? 'Connected' : 'Guest mode'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
