/**
 * P2Pigeon Application Starter
 * 
 * TypeScript startup script for the P2Pigeon platform
 * Provides a unified way to start the application with proper configuration
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Create environment configuration
const envContent = `
REACT_APP_HYPERNAT_PROTOCOL=http
REACT_APP_HYPERNAT_PORT=4000
PORT=3001
SKIP_PREFLIGHT_CHECK=true
GENERATE_SOURCEMAP=false
`;

// Create environment file
try {
  fs.writeFileSync(path.join(__dirname, '.env.local'), envContent.trim());
  console.log('✅ Environment configuration created');
} catch (error) {
  console.error('❌ Failed to create environment configuration:', error);
}

// Set environment variables for this process
process.env.PORT = '3001';
process.env.REACT_APP_HYPERNAT_PROTOCOL = 'http';
process.env.REACT_APP_HYPERNAT_PORT = '4000';
process.env.SKIP_PREFLIGHT_CHECK = 'true';
process.env.BROWSER = 'none';
process.env.NODE_OPTIONS = '--max-old-space-size=4096';
process.env.GENERATE_SOURCEMAP = 'false';

console.log('===================================================');
console.log('P2Pigeon Enterprise-Grade Secure Communication Platform');
console.log('===================================================');

// Clear cache if it exists
try {
  const cachePath = path.join(__dirname, 'node_modules', '.cache');
  if (fs.existsSync(cachePath)) {
    console.log('🧹 Clearing dependency caches...');
    fs.rmSync(cachePath, { recursive: true, force: true });
  }
} catch (error) {
  console.error('⚠️ Error clearing cache:', error);
}

// Start the application using React Scripts
console.log('🚀 Starting P2Pigeon application...');
console.log('Application will be available at http://localhost:3001');

const isWindows = process.platform === 'win32';
const reactScriptsPath = path.join(
  __dirname, 
  'node_modules', 
  '.bin', 
  isWindows ? 'react-scripts.cmd' : 'react-scripts'
);

const startProcess = spawn(reactScriptsPath, ['start'], {
  stdio: 'inherit',
  env: { ...process.env },
  shell: true
});

startProcess.on('error', (error: Error) => {
  console.error('❌ Failed to start application:', error);
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down P2Pigeon application...');
  startProcess.kill('SIGINT');
  process.exit(0);
});
