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
 * @file ResponsiveNavigation.tsx
 * @description Responsive navigation component with mobile support
 */

import React, { useState } from 'react';
import { Menu, X, Moon, Sun, Lock } from 'lucide-react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { NavigationItem } from '../../types/ui';

interface ResponsiveNavigationProps {
  logo?: React.ReactNode;
  items: NavigationItem[];
  showColorModeToggle?: boolean;
  isEncrypted?: boolean;
}

export const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({
  logo,
  items,
  showColorModeToggle = true,
  isEncrypted = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  const filteredItems = items.filter(item => !item.requiredPermissions?.length);

  return (
    <nav className="fixed w-full z-40 bg-gray-800 border-b border-gray-700" data-testid="responsive-navigation">
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <button className="md:hidden p-2 text-gray-400 hover:text-white" aria-label="Open Menu" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          <div className="flex items-center gap-8">
            {logo && <div>{logo}</div>}
            <div className="hidden md:flex items-center gap-4">
              {filteredItems.map((item) => (
                <RouterLink key={item.id} to={item.path} className={`px-3 py-2 rounded-md text-gray-300 hover:bg-gray-700 ${isActive(item.path) ? 'bg-gray-700' : ''}`} aria-current={isActive(item.path) ? 'page' : undefined}>
                  {item.label}
                </RouterLink>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isEncrypted && (
              <div className="flex items-center px-2 py-1 bg-green-900 text-green-200 rounded-md">
                <Lock className="w-4 h-4 mr-1" />
                <span className="hidden md:inline text-sm font-medium">Encrypted</span>
              </div>
            )}
            {showColorModeToggle && (
              <button className="p-2 text-gray-400 hover:text-white" aria-label="Toggle Color Mode" onClick={() => setIsDark(!isDark)}>
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-64 bg-gray-800 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <span className="text-white font-medium">Menu</span>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-2">
              {filteredItems.map((item) => (
                <RouterLink key={item.id} to={item.path} onClick={() => setIsOpen(false)} className={`block px-3 py-2 rounded-md text-gray-300 hover:bg-gray-700 ${isActive(item.path) ? 'bg-gray-700' : ''}`} aria-current={isActive(item.path) ? 'page' : undefined}>
                  {item.label}
                </RouterLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default ResponsiveNavigation;
