"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * P2Pigeon Electron Preload Script
 *
 * Securely exposes Electron APIs to the renderer process via contextBridge.
 * Implements secure IPC communication for P2P, file, and crypto operations.
 */
const electron_1 = require("electron");
// Store event listeners for cleanup
const p2pStateListeners = new Set();
// Handle P2P state updates from main process
electron_1.ipcRenderer.on('p2p:state', (_event, state) => {
    p2pStateListeners.forEach(callback => callback(state));
});
// Expose the API to the renderer
electron_1.contextBridge.exposeInMainWorld('pigeon', {
    // App info
    getAppInfo: () => electron_1.ipcRenderer.invoke('app:getInfo'),
    // Configuration
    getConfig: () => electron_1.ipcRenderer.invoke('config:get'),
    setConfig: (config) => electron_1.ipcRenderer.invoke('config:set', config),
    // P2P operations
    p2p: {
        getState: () => electron_1.ipcRenderer.invoke('p2p:getState'),
        getPublicKey: () => electron_1.ipcRenderer.invoke('p2p:getPublicKey'),
        onStateChange: (callback) => {
            p2pStateListeners.add(callback);
            return () => p2pStateListeners.delete(callback);
        }
    },
    // File operations
    file: {
        save: (data, filename, defaultPath) => electron_1.ipcRenderer.invoke('file:save', { data, filename, defaultPath }),
        open: (options) => electron_1.ipcRenderer.invoke('file:open', options)
    },
    // Crypto operations
    crypto: {
        generateKey: () => electron_1.ipcRenderer.invoke('crypto:generateKey'),
        hash: (data, algorithm = 'sha256') => electron_1.ipcRenderer.invoke('crypto:hash', data, algorithm),
        encrypt: (data, key) => electron_1.ipcRenderer.invoke('crypto:encrypt', { data, key }),
        decrypt: (encrypted, key, iv, authTag) => electron_1.ipcRenderer.invoke('crypto:decrypt', { encrypted, key, iv, authTag })
    },
    // Window controls
    window: {
        minimize: () => electron_1.ipcRenderer.send('window:minimize'),
        maximize: () => electron_1.ipcRenderer.send('window:maximize'),
        close: () => electron_1.ipcRenderer.send('window:close')
    },
    // Notifications
    notification: {
        show: (title, body) => electron_1.ipcRenderer.send('notification:show', { title, body })
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
        connect: () => electron_1.ipcRenderer.invoke('hyperswarm:connect'),
        disconnect: () => electron_1.ipcRenderer.invoke('hyperswarm:disconnect'),
        createRoom: (roomId) => electron_1.ipcRenderer.invoke('hyperswarm:createRoom', roomId),
        joinRoom: (roomId) => electron_1.ipcRenderer.invoke('hyperswarm:joinRoom', roomId),
        leaveRoom: (roomId) => electron_1.ipcRenderer.invoke('hyperswarm:leaveRoom', roomId),
        broadcast: (roomId, message) => electron_1.ipcRenderer.invoke('hyperswarm:broadcast', roomId, message),
        sendToPeer: (roomId, peerId, message) => electron_1.ipcRenderer.invoke('hyperswarm:sendToPeer', roomId, peerId, message),
        getPeers: (roomId) => electron_1.ipcRenderer.invoke('hyperswarm:getPeers', roomId),
        onPeerConnected: (callback) => {
            electron_1.ipcRenderer.on('hyperswarm:peerConnected', (_e, roomId, peerId) => callback(roomId, peerId));
        },
        onPeerDisconnected: (callback) => {
            electron_1.ipcRenderer.on('hyperswarm:peerDisconnected', (_e, roomId, peerId) => callback(roomId, peerId));
        },
        onMessage: (callback) => {
            electron_1.ipcRenderer.on('hyperswarm:message', (_e, roomId, peerId, message) => callback(roomId, peerId, message));
        }
    }
});
// Also expose a simple version check
electron_1.contextBridge.exposeInMainWorld('electronVersion', process.versions.electron);
// Log preload completion
console.log('P2Pigeon preload script loaded');
