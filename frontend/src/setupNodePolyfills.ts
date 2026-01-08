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
 * @file setupNodePolyfills.ts
 * @description Setup Node.js polyfills for P2Pigeon browser environment
 */

import * as processType from 'process';
import * as bufferType from 'buffer';

// Import all required polyfills
if (typeof window !== 'undefined') {
  // Add browser polyfills for Node.js core modules
  window.global = window;
  
  // Use type assertion to handle dynamic imports
  window.process = require('process') as typeof processType;
  window.Buffer = require('buffer').Buffer as typeof bufferType.Buffer;
}

// Export polyfills with proper typing
export const nodePolyfills = {
  process: window.process,
  Buffer: window.Buffer
};

export default nodePolyfills;
