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
 * @file MaintenancePage.tsx
 * @description This component renders the site maintenance page.
 * It replaces the static maintenance.html file with a modern, reusable React component
 * that is integrated into the application's routing system.
 */

import React from 'react';
import { Wrench } from 'lucide-react';

const MaintenancePage: React.FC = () => {
  return (
    <div className="h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-8 text-center">
        <Wrench className="w-20 h-20 text-cyan-500" />
        <h1 className="text-4xl font-bold text-gray-800">Under Maintenance</h1>
        <p className="text-lg text-gray-600">We are currently performing scheduled maintenance.</p>
        <p className="text-gray-500">We should be back online shortly. Thank you for your patience!</p>
      </div>
    </div>
  );
};

export default MaintenancePage;
