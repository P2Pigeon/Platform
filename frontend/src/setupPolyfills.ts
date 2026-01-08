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
 * Complete polyfill configuration for P2Pigeon
 * Provides browser compatibility for Node.js core modules.
 */

// Import required polyfills - using import syntax for ESM compatibility
import buffer from 'buffer';
import process from 'process/browser';
import pathBrowserify from 'path-browserify';
import streamBrowserify from 'stream-browserify';
import util from 'util';

// Type declarations for global augmentation
declare global {
  interface Window {
    global: typeof globalThis;
    process: any; // Using any here as the process API is extensive
    Buffer: typeof Buffer;
    path: any;
    stream: any;
    util: any;
    crypto: typeof Crypto;
  }
}

// Make global available in browser environment
if (typeof global === 'undefined') {
  window.global = window;
}

// Set up polyfills using imported modules - safer approach
try {
  // Buffer setup
  global.Buffer = buffer.Buffer;
  window.Buffer = buffer.Buffer;
  
  // Process setup
  window.process = process;
  global.process = process;
} catch (err) {
  console.warn('Error setting up core polyfills:', err instanceof Error ? err.message : String(err));
  
  // Fallback process implementation if module fails to load
  window.process = window.process || {
    env: {},
    browser: true,
    version: '',
    nextTick: (fn: Function): void => { setTimeout(fn, 0); }
  };
}

// Buffer is already handled in the core setup above

// Performance timing polyfill for older browsers
if (!window.performance) {
  // Following Enterprise TypeScript best practices - use partial implementation 
  // with the critical methods needed for our application
  // We use a minimal subset and cast as unknown first to satisfy TypeScript
  const minimalPerformance = {
    now: (): number => Date.now(),
    mark: (): void => {},
    measure: (): void => {},
    getEntries: (): PerformanceEntry[] => [],
    getEntriesByName: (): PerformanceEntry[] => [],
    getEntriesByType: (): PerformanceEntry[] => [],
    clearMarks: (): void => {},
    clearMeasures: (): void => {},
    clearResourceTimings: (): void => {}, // Added missing methods
    setResourceTimingBufferSize: (): void => {},
    timeOrigin: Date.now(),
    eventCounts: new Map() as any
  };
  
  // Using a proper type assertion pattern for safety
  window.performance = minimalPerformance as unknown as Performance;
}

// Path polyfill setup
if (!window.path) {
  try {
    window.path = pathBrowserify;
  } catch (err) {
    console.warn('Path polyfill not available:', err instanceof Error ? err.message : String(err));
  }
}

// Stream polyfill setup
if (!window.stream) {
  try {
    window.stream = streamBrowserify;
  } catch (err) {
    console.warn('Stream polyfill not available:', err instanceof Error ? err.message : String(err));
  }
}

// Util polyfill setup
if (!window.util) {
  try {
    window.util = util;
  } catch (err) {
    console.warn('Util polyfill not available:', err instanceof Error ? err.message : String(err));
  }
}

// For secure P2P communications, ensure crypto is available
if (!window.crypto) {
  try {
    // Dynamic import for crypto-browserify to prevent build issues
    import('crypto-browserify').then(cryptoBrowserify => {
      window.crypto = cryptoBrowserify.default || cryptoBrowserify;
      console.log('Using crypto-browserify polyfill');
    }).catch(err => {
      console.error('Failed to load crypto-browserify:', err instanceof Error ? err.message : String(err));
    });
  } catch (err) {
    console.error('Web Crypto API is required for secure P2P communications');
  }
}

// Set up proper security mechanisms following zero-trust principles
if (window.crypto && window.crypto.subtle) {
  // We have what we need for end-to-end encryption
  console.log('Web Crypto API is available for secure communications');
} else {
  console.warn('Web Crypto subtle API unavailable, security features may be limited');
}

console.log('P2Pigeon: Node.js polyfills initialized');


export {}; // This file is a module with side-effects
