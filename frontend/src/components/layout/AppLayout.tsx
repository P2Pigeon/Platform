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
 * @file AppLayout.tsx
 * @description Global application layout component that provides consistent structure,
 * navigation, and visual identity across the application.
 */

import React, { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Video, Settings, User, HelpCircle, Menu, Shield, Lock, Bell, ChevronRight, X } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
  pageTitle?: string;
  isCallPage?: boolean;
  sidebarEnabled?: boolean;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  pageTitle,
  isCallPage = false,
  sidebarEnabled = true,
  breadcrumbs = []
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  
  const navItems = [
    { name: 'Home', icon: Home, path: '/' },
    { name: 'Start Meeting', icon: Video, path: '/start-call' },
    { name: 'Settings', icon: Settings, path: '/settings' },
  ];
  
  if (isCallPage) {
    return <div className="min-h-screen bg-gray-900">{children}</div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 h-16 flex items-center justify-between px-4 md:px-6 bg-gray-900 shadow-[0_0_20px_rgba(0,204,255,0.1)] backdrop-blur-sm">
        <div className="flex items-center gap-4">
          {sidebarEnabled && (
            <button
              aria-label="Open menu"
              onClick={() => setIsDrawerOpen(true)}
              className="lg:hidden p-2 text-cyan-400 hover:bg-gray-800 rounded"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500 shadow-[0_0_15px_rgba(0,204,255,0.4)]">
              <Lock className="w-5 h-5 text-cyan-400" />
            </div>
            <h1 className="text-lg font-mono uppercase tracking-wider text-cyan-400 [text-shadow:0_0_10px_rgba(0,204,255,0.5)]">
              P2PIGEON
            </h1>
            <span className="px-2 py-0.5 bg-gray-800 text-cyan-400 border border-cyan-500 text-xs font-mono uppercase tracking-wider shadow-[0_0_5px_rgba(0,204,255,0.3)]">
              SECURE
            </span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            aria-label="Notifications"
            title="NOTIFICATIONS"
            className="p-2 text-cyan-400 hover:bg-gray-800 hover:shadow-[0_0_10px_rgba(0,204,255,0.3)]"
          >
            <Bell className="w-5 h-5" />
          </button>
          
          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="p-1 text-cyan-400 hover:bg-gray-800 hover:shadow-[0_0_10px_rgba(0,204,255,0.3)]"
            >
              <div className="w-8 h-8 flex items-center justify-center bg-gray-800 text-cyan-400 border border-cyan-500 text-sm font-bold">
                U
              </div>
            </button>
            
            {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-cyan-500 shadow-[0_0_20px_rgba(0,204,255,0.3)] z-50">
                  <button className="w-full px-4 py-2 flex items-center gap-2 text-cyan-400 font-mono uppercase text-sm hover:bg-gray-700">
                    <User className="w-4 h-4" /> PROFILE
                  </button>
                  <button className="w-full px-4 py-2 flex items-center gap-2 text-cyan-400 font-mono uppercase text-sm hover:bg-gray-700">
                    <Settings className="w-4 h-4" /> SETTINGS
                  </button>
                  <button className="w-full px-4 py-2 flex items-center gap-2 text-cyan-400 font-mono uppercase text-sm hover:bg-gray-700">
                    <Shield className="w-4 h-4" /> SECURITY
                  </button>
                  <hr className="border-gray-700" />
                  <button className="w-full px-4 py-2 flex items-center gap-2 text-cyan-400 font-mono uppercase text-sm hover:bg-gray-700">
                    <HelpCircle className="w-4 h-4" /> HELP
                  </button>
                  <button className="w-full px-4 py-2 text-red-400 font-mono uppercase text-sm hover:bg-gray-700">
                    SIGN OUT
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      
      {/* Mobile Drawer */}
      {sidebarEnabled && isDrawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/80 z-40 lg:hidden" onClick={() => setIsDrawerOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 z-50 lg:hidden">
            <div className="flex items-center justify-between p-4 bg-gray-800">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400 font-mono uppercase tracking-wider [text-shadow:0_0_10px_rgba(0,204,255,0.5)]">
                  P2PIGEON
                </span>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="text-cyan-400 hover:bg-gray-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex flex-col">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsDrawerOpen(false)}
                  className={`flex items-center gap-4 px-4 py-4 text-cyan-400 font-mono uppercase tracking-wider hover:bg-gray-800 ${
                    location.pathname === item.path ? 'bg-gray-800 font-bold' : ''
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}
      
      {/* Main content area */}
      <div className="flex">
        {/* Desktop Sidebar */}
        {sidebarEnabled && (
          <aside className="hidden lg:block fixed w-64 h-[calc(100vh-4rem)] top-16 bg-gray-900 overflow-y-auto">
            <nav className="flex flex-col mt-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-4 px-4 py-4 text-cyan-400 font-mono uppercase tracking-wider hover:bg-gray-800 ${
                    location.pathname === item.path ? 'bg-gray-800 font-bold' : ''
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </aside>
        )}
        
        {/* Main content */}
        <main
          className={`mt-16 p-4 md:p-6 min-h-[calc(100vh-4rem)] transition-all duration-200 w-full ${
            sidebarEnabled ? 'lg:ml-64 lg:w-[calc(100%-16rem)]' : ''
          }`}
        >
          {(pageTitle || breadcrumbs.length > 0) && (
            <div className="mb-6">
              {breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-2 mb-2">
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <ChevronRight className="w-4 h-4 text-cyan-400" />}
                      {crumb.href ? (
                        <Link
                          to={crumb.href}
                          className="text-cyan-400 font-mono uppercase tracking-wider text-sm hover:text-cyan-300"
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className="text-gray-400 font-mono uppercase tracking-wider text-sm">
                          {crumb.label}
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </nav>
              )}
              
              {pageTitle && (
                <h1 className="text-2xl text-cyan-400 font-mono uppercase tracking-wider [text-shadow:0_0_10px_rgba(0,204,255,0.5)]">
                  {pageTitle}
                </h1>
              )}
            </div>
          )}
          
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
