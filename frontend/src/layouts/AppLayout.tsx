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
 * AppLayout Component
 * 
 * Main layout for authenticated application pages. */
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useCommunication } from '../context/CommunicationContext';

/**
 * AppLayout provides consistent layout structure for authenticated app pages
 * Includes sidebar navigation and content area
 */
const AppLayout: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { isConnected } = useCommunication();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onOpen={() => setIsOpen(true)}
        isConnected={isConnected}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 p-4 bg-gray-900 overflow-auto transition-[margin-left] duration-300 ${isOpen ? 'md:ml-60' : 'ml-0'} md:border-l md:border-gray-700`}
      >
        {/* Render child routes */}
        <Outlet />
      </div>
    </div>
  );
};

export default AppLayout;
