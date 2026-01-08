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
 * @file TestStunTurnPage.tsx
 * @description This component provides a utility to test STUN/TURN server configurations.
 * It replaces the static testStunTurn.html file with a modern, reusable React component.
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const TestStunTurnPage: React.FC = () => {
  const [iceServers, setIceServers] = useState<RTCIceServer[]>([]);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [isTesting, setIsTesting] = useState(true);
  const [parseError, setParseError] = useState<string>('');
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const iceServersParam = params.get('iceServers');
    let servers: RTCIceServer[] = [];

    if (iceServersParam) {
      try {
        servers = JSON.parse(iceServersParam);
      } catch (e) {
        setParseError('Invalid ICE servers in URL');
      }
    } else {
      servers = [
        { urls: 'stun:stun.l.google.com:19302' },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject',
        },
      ];
    }
    setIceServers(servers);
  }, [location.search]);

  useEffect(() => {
    if (iceServers.length === 0) return;

    const pc = new RTCPeerConnection({ iceServers });

    pc.onicecandidate = (e) => {
      if (!e.candidate) {
        setIsTesting(false);
        return;
      }
      setResults(prev => [...prev, e.candidate!.candidate]);
    };

    pc.onicecandidateerror = (e) => {
      setError(`Error: ${e.errorText}`);
      setIsTesting(false);
    };

    pc.createDataChannel('test');
    pc.createOffer().then((offer) => pc.setLocalDescription(offer));

    return () => {
      pc.close();
    };
  }, [iceServers]);

  const renderStatus = (type: 'stun' | 'turn') => {
    const isReachable = results.some(r => r.includes(type === 'stun' ? 'srflx' : 'relay'));
    return (
      <p className={isReachable ? 'text-green-500' : 'text-red-500'}>
        {isReachable ? `🟢 The ${type.toUpperCase()} server is reachable!` : `🔴 The ${type.toUpperCase()} server is NOT reachable!`}
      </p>
    );
  };

  return (
    <div className="p-8">
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Test STUN/TURN Servers</h1>
        {parseError && <p className="text-red-500">{parseError}</p>}
        <div>
          <h2 className="text-2xl font-bold mb-2">Configuration</h2>
          <code className="block p-4 rounded-md bg-gray-800 text-white w-full whitespace-pre-wrap">
            {JSON.stringify(iceServers, null, 2)}
          </code>
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Results</h2>
          {isTesting && <Loader2 className="w-6 h-6 animate-spin" />}
          {renderStatus('stun')}
          {renderStatus('turn')}
          {error && <p className="text-red-500">{error}</p>}
          <code className="block p-4 rounded-md bg-gray-800 text-white w-full h-[200px] overflow-y-auto whitespace-pre-wrap">
            {results.join('\n')}
          </code>
        </div>
      </div>
    </div>
  );
};

export default TestStunTurnPage;
