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
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Video, Settings, ChevronLeft, ChevronRight, Database, X, MessageCircle, Users } from 'lucide-react';

interface NavItemProps {
  icon: React.ElementType;
  to: string;
  label: string;
  onClose: () => void;
  isCollapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, to, label, onClose, isCollapsed }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/app' && location.pathname.startsWith(to));

  return (
    <NavLink
      to={to}
      onClick={onClose}
      className={`
        group flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg
        transition-all duration-200
        ${isActive 
          ? 'bg-pigeon-primary/20 text-pigeon-primary' 
          : 'text-pigeon-text-secondary hover:bg-white/5 hover:text-pigeon-text'
        }
      `}
    >
      <div className={`
        w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200
        ${isActive 
          ? 'bg-pigeon-primary text-white shadow-glow' 
          : 'bg-pigeon-surface group-hover:bg-pigeon-surface-light'
        }
      `}>
        <Icon className="w-[18px] h-[18px]" />
      </div>
      {!isCollapsed && (
        <span className="font-medium text-sm">{label}</span>
      )}
    </NavLink>
  );
};

interface SidebarContentProps {
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  hideLogo?: boolean;
}

const navItems = [
  { to: '/app', icon: Home, label: 'Dashboard' },
  { to: '/app/calls', icon: Video, label: 'Meetings' },
  { to: '/app/files', icon: Database, label: 'Data Rooms' },
  { to: '/app/chat', icon: MessageCircle, label: 'Nostr Chat' },
  { to: '/app/contacts', icon: Users, label: 'Contacts' },
  { to: '/app/settings', icon: Settings, label: 'Settings' },
];

const SidebarContent: React.FC<SidebarContentProps> = ({ onClose, isCollapsed, onToggleCollapse, hideLogo }) => (
  <div className="flex flex-col h-full bg-pigeon-bg-elevated/50 backdrop-blur-xl">
    {/* Logo - hidden when rendered in mobile drawer which has its own header */}
    {!hideLogo && (
      <div className={`h-16 flex items-center border-b border-white/5 ${isCollapsed ? 'justify-center px-2' : 'px-4'}`}>
        <span className="text-2xl flex-shrink-0">🕊️</span>
        {!isCollapsed && (
          <span className="ml-3 text-lg font-bold text-pigeon-text">P2Pigeon</span>
        )}
      </div>
    )}

    {/* Navigation */}
    <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
      {navItems.map((item) => (
        <NavItem
          key={item.to}
          to={item.to}
          icon={item.icon}
          label={item.label}
          onClose={onClose}
          isCollapsed={isCollapsed}
        />
      ))}
    </nav>


    {/* Collapse Button */}
    <div className="hidden md:flex p-3 justify-center">
      <button
        onClick={onToggleCollapse}
        className="p-2 rounded-lg text-pigeon-text-muted hover:text-pigeon-text hover:bg-white/5 transition-all"
        aria-label="Toggle sidebar"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  </div>
);

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 z-50 transform transition-transform duration-300 ease-out
          md:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-full bg-pigeon-bg-elevated">
          <div className="flex items-center justify-between h-16 px-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-pigeon-text">P2Pigeon</span>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg text-pigeon-text-muted hover:text-pigeon-text hover:bg-white/5">
              <X className="w-5 h-5" />
            </button>
          </div>
          <SidebarContent onClose={onClose} isCollapsed={false} onToggleCollapse={onToggleCollapse} hideLogo />
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden md:block fixed top-0 left-0 h-full
          transition-all duration-300 ease-out z-40
          ${isCollapsed ? 'w-[72px]' : 'w-64'}
        `}
      >
        <SidebarContent onClose={onClose} isCollapsed={isCollapsed} onToggleCollapse={onToggleCollapse} />
      </aside>
    </>
  );
};

export default Sidebar;
