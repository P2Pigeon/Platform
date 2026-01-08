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
 * @file testUtils.ts
 * @description Test utilities for unit testing
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

/**
 * Custom render function that wraps components with necessary providers
 * @param ui - Component to render
 * @param options - Additional render options
 * @returns The rendered component with testing utilities
 */
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  const AllProviders = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
  
  return render(ui, { wrapper: AllProviders, ...options });
};

/**
 * Mock crypto implementation for testing encryption functions
 */
export const mockCrypto = () => {
  const originalCrypto = window.crypto;
  
  const mockSubtle = {
    encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
    decrypt: jest.fn().mockResolvedValue(new TextEncoder().encode('decrypted').buffer),
    generateKey: jest.fn().mockResolvedValue({
      publicKey: 'mock-public-key',
      privateKey: 'mock-private-key',
    }),
    exportKey: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
    importKey: jest.fn().mockResolvedValue('mock-imported-key'),
    deriveKey: jest.fn().mockResolvedValue('mock-derived-key'),
    deriveBits: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
    sign: jest.fn().mockResolvedValue(new ArrayBuffer(64)),
    verify: jest.fn().mockResolvedValue(true),
  };
  
  const mockCryptoObj = {
    subtle: mockSubtle,
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    randomUUID: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    }),
  };
  
  // Replace window.crypto with mock implementation
  Object.defineProperty(window, 'crypto', {
    value: mockCryptoObj,
    writable: true,
  });
  
  // Return function to restore original crypto
  return () => {
    Object.defineProperty(window, 'crypto', {
      value: originalCrypto,
      writable: true,
    });
  };
};

/**
 * Mock WebRTC for testing P2P functionality
 */
export const mockWebRTC = () => {
  const mockPeerConnection = {
    createOffer: jest.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' }),
    createAnswer: jest.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-sdp' }),
    setLocalDescription: jest.fn().mockResolvedValue(undefined),
    setRemoteDescription: jest.fn().mockResolvedValue(undefined),
    addIceCandidate: jest.fn().mockResolvedValue(undefined),
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  
  // Mock RTCPeerConnection constructor
  global.RTCPeerConnection = jest.fn().mockImplementation(() => mockPeerConnection);
  
  // Return function to access mock methods for assertions
  return {
    mockPeerConnection,
  };
};

/**
 * Create a mock for the MediaStream API
 */
export const mockMediaStream = () => {
  const mockStream = {
    getTracks: jest.fn().mockReturnValue([
      { kind: 'audio', enabled: true, stop: jest.fn() },
      { kind: 'video', enabled: true, stop: jest.fn() },
    ]),
    getAudioTracks: jest.fn().mockReturnValue([
      { kind: 'audio', enabled: true, stop: jest.fn() },
    ]),
    getVideoTracks: jest.fn().mockReturnValue([
      { kind: 'video', enabled: true, stop: jest.fn() },
    ]),
    addTrack: jest.fn(),
    removeTrack: jest.fn(),
  };
  
  // Mock getUserMedia
  global.navigator.mediaDevices = {
    getUserMedia: jest.fn().mockResolvedValue(mockStream),
    getDisplayMedia: jest.fn().mockResolvedValue(mockStream),
    enumerateDevices: jest.fn().mockResolvedValue([
      { kind: 'audioinput', deviceId: 'audio1', label: 'Microphone' },
      { kind: 'videoinput', deviceId: 'video1', label: 'Camera' },
      { kind: 'audiooutput', deviceId: 'audioout1', label: 'Speakers' },
    ]),
  } as any;
  
  return {
    mockStream,
  };
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };
