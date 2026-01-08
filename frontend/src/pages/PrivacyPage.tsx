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
 * @file PrivacyPage.tsx
 * @description This component renders the privacy policy page.
 * It replaces the static privacy.html file with a modern, reusable React component
 * that is integrated into the application's routing system.
 */

import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

const PrivacyPage: React.FC = () => {
  return (
    <div className="bg-gray-50 py-20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col gap-8 items-start">
          <h1 className="text-4xl font-bold text-gray-800">Privacy Policy</h1>
          <p className="text-gray-600">
            We limit ourselves to collect the smallest amount of user data that we need in order to create a seamless experience when using{' '}
            <strong>Pigeon</strong>.
          </p>
          <p className="text-gray-600">
            This data includes mainly:{' '}
            <a href="https://developer.mozilla.org/en-US/docs/Web/API/RTCIceCandidate" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline">
              RTCICECandidates
            </a>{' '}
            &{' '}
            <a href="https://developer.mozilla.org/en-US/docs/Web/API/RTCSessionDescription" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline">
              RTCSessionDescription
            </a>{' '}
            which is needed to establish the video call using WebRTC. RTCICECandidates, RTCSessionDescription is not stored in any persistent database, it's removed from the server as soon as the user leaves the call by closing the browser window. The media streams are encrypted using Secure Real-time Transport Protocol (SRTP). The signaling part is done by exchanging messages over a secure WebSocket (WSS) to our server. All the media streams are sent directly to the other users in the same room (peer-to-peer) and they are encrypted using{' '}
            <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Security#encryption" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline">
              Datagram Transport Layer Security
            </a>{' '}
            (DTLS). DTLS is a derivative of SSL, meaning your data will be as secure as using any standard SSL-based connection.
          </p>
          <p className="text-gray-600">
            We do not store any of the data mentioned above in any persistent database. We do not sell any of this data to third parties. We do not use any of this data for any other purpose than to provide the service. The maker of{' '}
            <strong>Pigeon</strong> has no intention of using personally or selling any of the above-mentioned data.
          </p>
          <RouterLink to="/newcall" className="px-6 py-3 bg-cyan-500 text-white rounded-lg text-lg hover:bg-cyan-600">
            AGREE
          </RouterLink>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
