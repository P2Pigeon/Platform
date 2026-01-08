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
 * @file AboutPage.tsx
 * @description This component renders the about page, which embeds external content.
 * It replaces the static about.html file with a modern, reusable React component.
 */

import React from 'react';

const AboutPage: React.FC = () => {
  // The original about.html file embedded a Canva presentation.
  // The source URL was missing. We will use a placeholder here.
  // TODO: Replace with the actual embed URL for the presentation.
  const embedUrl = '';

  return (
    <div className="p-8">
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        {embedUrl ? (
          <iframe
            title="About P2Pigeon Presentation"
            src={embedUrl}
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-md">
            <p className="text-gray-500">Presentation content is currently unavailable.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AboutPage;
