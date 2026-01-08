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
 * @file NotFoundPage.tsx
 * @description This component renders the 404 Not Found page.
 * It replaces the static 404.html file with a modern, reusable React component
 * that is integrated into the application's routing system.
 */

import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-7xl font-bold text-cyan-500">404</h1>
        <p className="text-2xl text-gray-600">Oops! The page you're looking for does not exist.</p>
        <p className="text-gray-500">It might have been moved or deleted.</p>
        <Link to="/" className="px-6 py-3 bg-cyan-500 text-white rounded-lg text-lg hover:bg-cyan-600">
          Go back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
