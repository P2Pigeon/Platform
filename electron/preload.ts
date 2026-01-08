/**
 * P2Pigeon Electron Preload Script
 * 
 * Securely exposes Electron APIs to the renderer process via contextBridge.
 * Implements secure IPC communication for P2P, file, and crypto operations.
 */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Type definitions for exposed APIs
interface AppInfo {
  version: string;
  name: string;
  platform: string;
  arch: string;
  isRSEArqon: boolean;
  isDev: boolean;
}

interface AppConfig {
  serverUrl: string;
  autoStart: boolean;
  minimizeToTray: boolean;
  theme: 'dark' | 'light' | 'system';
}

interface P2PState {
  publicKey: string | null;
  isConnected: boolean;
  connectedPeers: number;
}

interface FileInfo {
  path: string;
  name: string;
  data: Buffer;
}

interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
}

// Exposed API interface
interface PigeonAPI {
  // App info
  getAppInfo: () => Promise<AppInfo>;
  
  // Configuration
  getConfig: () => Promise<AppConfig>;
  setConfig: (config: Partial<AppConfig>) => Promise<AppConfig>;
  
  // P2P operations
  p2p: {
    getState: () => Promise<P2PState>;
    getPublicKey: () => Promise<string>;
    onStateChange: (callback: (state: P2PState) => void) => () => void;
  };
  
  // File operations
  file: {
    save: (data: Buffer | string, filename: string, defaultPath?: string) => Promise<string | null>;
    open: (options?: {
      filters?: Array<{ name: string; extensions: string[] }>;
      multiple?: boolean;
    }) => Promise<FileInfo | FileInfo[] | null>;
  };
  
  // Crypto operations (native performance)
  crypto: {
    generateKey: () => Promise<string>;
    hash: (data: Buffer | string, algorithm?: string) => Promise<string>;
    encrypt: (data: Buffer | string, key: string) => Promise<EncryptedData>;
    decrypt: (encrypted: string, key: string, iv: string, authTag: string) => Promise<string>;
  };
  
  // Window controls (for frameless mode)
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
  };
  
  // Notifications
  notification: {
    show: (title: string, body: string) => void;
  };
  
  // Platform detection
  platform: {
    isElectron: boolean;
    isRSEArqon: boolean;
    isMac: boolean;
    isWindows: boolean;
    isLinux: boolean;
  };
}

// Store event listeners for cleanup
const p2pStateListeners = new Set<(state: P2PState) => void>();

// Handle P2P state updates from main process
ipcRenderer.on('p2p:state', (_event: IpcRendererEvent, state: P2PState) => {
  p2pStateListeners.forEach(callback => callback(state));
});

// Expose the API to the renderer
contextBridge.exposeInMainWorld('pigeon', {
  // App info
  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
  
  // Configuration
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (config: Partial<AppConfig>) => ipcRenderer.invoke('config:set', config),
  
  // P2P operations
  p2p: {
    getState: () => ipcRenderer.invoke('p2p:getState'),
    getPublicKey: () => ipcRenderer.invoke('p2p:getPublicKey'),
    onStateChange: (callback: (state: P2PState) => void) => {
      p2pStateListeners.add(callback);
      return () => p2pStateListeners.delete(callback);
    }
  },
  
  // File operations
  file: {
    save: (data: Buffer | string, filename: string, defaultPath?: string) => 
      ipcRenderer.invoke('file:save', { data, filename, defaultPath }),
    open: (options?: {
      filters?: Array<{ name: string; extensions: string[] }>;
      multiple?: boolean;
    }) => ipcRenderer.invoke('file:open', options)
  },
  
  // Crypto operations
  crypto: {
    generateKey: () => ipcRenderer.invoke('crypto:generateKey'),
    hash: (data: Buffer | string, algorithm = 'sha256') => 
      ipcRenderer.invoke('crypto:hash', data, algorithm),
    encrypt: (data: Buffer | string, key: string) => 
      ipcRenderer.invoke('crypto:encrypt', { data, key }),
    decrypt: (encrypted: string, key: string, iv: string, authTag: string) => 
      ipcRenderer.invoke('crypto:decrypt', { encrypted, key, iv, authTag })
  },
  
  // Window controls
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close')
  },
  
  // Notifications
  notification: {
    show: (title: string, body: string) => 
      ipcRenderer.send('notification:show', { title, body })
  },
  
  // Platform detection
  platform: {
    isElectron: true,
    isRSEArqon: process.env.RSE_ARQON === 'true',
    isMac: process.platform === 'darwin',
    isWindows: process.platform === 'win32',
    isLinux: process.platform === 'linux'
  },
  
  // Native Hyperswarm P2P
  hyperswarm: {
    connect: () => ipcRenderer.invoke('hyperswarm:connect'),
    disconnect: () => ipcRenderer.invoke('hyperswarm:disconnect'),
    createRoom: (roomId: string) => ipcRenderer.invoke('hyperswarm:createRoom', roomId),
    joinRoom: (roomId: string) => ipcRenderer.invoke('hyperswarm:joinRoom', roomId),
    leaveRoom: (roomId: string) => ipcRenderer.invoke('hyperswarm:leaveRoom', roomId),
    broadcast: (roomId: string, message: unknown) => ipcRenderer.invoke('hyperswarm:broadcast', roomId, message),
    sendToPeer: (roomId: string, peerId: string, message: unknown) => ipcRenderer.invoke('hyperswarm:sendToPeer', roomId, peerId, message),
    getPeers: (roomId: string) => ipcRenderer.invoke('hyperswarm:getPeers', roomId),
    onPeerConnected: (callback: (roomId: string, peerId: string) => void) => {
      ipcRenderer.on('hyperswarm:peerConnected', (_e, roomId, peerId) => callback(roomId, peerId));
    },
    onPeerDisconnected: (callback: (roomId: string, peerId: string) => void) => {
      ipcRenderer.on('hyperswarm:peerDisconnected', (_e, roomId, peerId) => callback(roomId, peerId));
    },
    onMessage: (callback: (roomId: string, peerId: string, message: unknown) => void) => {
      ipcRenderer.on('hyperswarm:message', (_e, roomId, peerId, message) => callback(roomId, peerId, message));
    }
  }
} as PigeonAPI);

// Also expose a simple version check
contextBridge.exposeInMainWorld('electronVersion', process.versions.electron);

// Log preload completion
console.log('P2Pigeon preload script loaded');
