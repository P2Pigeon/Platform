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
 * @file WhiteboardControls.tsx
 * @description Provides controls for the whiteboard, such as pen, eraser, and colors.
 */

import React from 'react';
import { Pencil, Eraser, Trash2 } from 'lucide-react';

const WhiteboardControls: React.FC = () => {
  return (
    <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-white p-2 rounded-md shadow-md z-[21]">
      <div className="flex items-center gap-2">
        <button aria-label="Pen" className="p-2 rounded hover:bg-gray-100"><Pencil size={16} /></button>
        <button aria-label="Eraser" className="p-2 rounded hover:bg-gray-100"><Eraser size={16} /></button>
        <input type="color" className="w-10 h-8" />
        <button aria-label="Clear" className="p-2 rounded hover:bg-gray-100"><Trash2 size={16} /></button>
      </div>
    </div>
  );
};

export default WhiteboardControls;
