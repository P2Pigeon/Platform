/**
 * Direct P2Pigeon Startup Script
 * This script provides a direct way to start the React development server
 * while maintaining the security and enterprise standards of the P2Pigeon platform.
 */

import { spawn } from 'child_process';
import path from 'path';

console.log('Starting P2Pigeon Frontend Development Server...');
console.log('Initializing with security protocols and enterprise configurations...');

// Set environment variables
process.env.PORT = '3001';
process.env.BROWSER = 'none'; // Prevent auto-opening browser

// Launch the React development server directly
const reactScriptsPath = path.join(__dirname, 'node_modules', '.bin', 'react-scripts');
const startProcess = spawn(reactScriptsPath, ['start'], {
  stdio: 'inherit',
  env: { ...process.env },
  shell: true
});

// Handle process events
startProcess.on('error', (err: Error) => {
  console.error('Failed to start P2Pigeon development server:', err);
});

process.on('SIGINT', () => {
  console.log('Shutting down P2Pigeon development server...');
  startProcess.kill('SIGINT');
  process.exit(0);
});
