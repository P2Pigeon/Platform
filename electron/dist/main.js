"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * P2Pigeon Electron Main Process
 *
 * Enhanced Electron shell with native P2P capabilities via Hyperswarm DHT.
 * Supports both standalone desktop mode and integration with RSE-Arqon OS.
 */
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const crypto = __importStar(require("crypto"));
// Environment detection
const isDev = process.env.NODE_ENV === 'development';
const isRSEArqon = process.env.RSE_ARQON === 'true';
// Window references
let mainWindow = null;
let tray = null;
let p2pState = {
    publicKey: null,
    isConnected: false,
    connectedPeers: 0
};
// Configuration paths
const userDataPath = electron_1.app.getPath('userData');
const configPath = path.join(userDataPath, 'config.json');
const keysPath = path.join(userDataPath, 'keys');
const defaultConfig = {
    serverUrl: isDev ? 'http://localhost:5173' : 'http://localhost:3001',
    autoStart: false,
    minimizeToTray: true,
    theme: 'dark'
};
/**
 * Load or create configuration
 */
function loadConfig() {
    try {
        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf-8');
            return { ...defaultConfig, ...JSON.parse(data) };
        }
    }
    catch (error) {
        console.error('Failed to load config:', error);
    }
    return defaultConfig;
}
/**
 * Save configuration
 */
function saveConfig(config) {
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }
    catch (error) {
        console.error('Failed to save config:', error);
    }
}
/**
 * Generate or load keypair for P2P identity
 */
async function initializeKeys() {
    const publicKeyPath = path.join(keysPath, 'public.key');
    const privateKeyPath = path.join(keysPath, 'private.key');
    if (!fs.existsSync(keysPath)) {
        fs.mkdirSync(keysPath, { recursive: true });
    }
    if (fs.existsSync(publicKeyPath) && fs.existsSync(privateKeyPath)) {
        return {
            publicKey: fs.readFileSync(publicKeyPath, 'utf-8'),
            privateKey: fs.readFileSync(privateKeyPath, 'utf-8')
        };
    }
    // Generate new Ed25519 keypair
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    fs.writeFileSync(publicKeyPath, publicKey);
    fs.writeFileSync(privateKeyPath, privateKey);
    return { publicKey, privateKey };
}
/**
 * Create the main application window
 */
function createWindow() {
    const config = loadConfig();
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        title: 'P2Pigeon',
        icon: path.join(__dirname, '../public/pigeon-icon.png'),
        backgroundColor: '#050810',
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            webSecurity: !isDev, // Disable in dev for local testing
        },
        // Frameless for RSE-Arqon integration
        ...(isRSEArqon && {
            frame: false,
            transparent: true,
        })
    });
    // Load the app
    if (isDev) {
        mainWindow.loadURL(config.serverUrl);
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../../frontend/build/index.html'));
    }
    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
        // Send initial P2P state to renderer
        mainWindow?.webContents.send('p2p:state', p2pState);
    });
    // Handle window close
    mainWindow.on('close', (event) => {
        const config = loadConfig();
        if (config.minimizeToTray && tray) {
            event.preventDefault();
            mainWindow?.hide();
        }
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        electron_1.shell.openExternal(url);
        return { action: 'deny' };
    });
}
/**
 * Create system tray
 */
function createTray() {
    const iconPath = path.join(__dirname, '../public/pigeon-icon.png');
    // Use a fallback if icon doesn't exist
    if (!fs.existsSync(iconPath)) {
        console.warn('Tray icon not found, skipping tray creation');
        return;
    }
    tray = new electron_1.Tray(iconPath);
    const contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: 'Open P2Pigeon',
            click: () => mainWindow?.show()
        },
        { type: 'separator' },
        {
            label: p2pState.isConnected
                ? `Connected (${p2pState.connectedPeers} peers)`
                : 'Disconnected',
            enabled: false
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                electron_1.app.quit();
            }
        }
    ]);
    tray.setToolTip('P2Pigeon - Secure P2P Communication');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
        mainWindow?.show();
    });
}
/**
 * Setup IPC handlers for renderer communication
 */
function setupIPCHandlers() {
    // Get app info
    electron_1.ipcMain.handle('app:getInfo', () => {
        return {
            version: electron_1.app.getVersion(),
            name: electron_1.app.getName(),
            platform: process.platform,
            arch: process.arch,
            isRSEArqon,
            isDev
        };
    });
    // Config operations
    electron_1.ipcMain.handle('config:get', () => loadConfig());
    electron_1.ipcMain.handle('config:set', (_event, config) => {
        const current = loadConfig();
        saveConfig({ ...current, ...config });
        return loadConfig();
    });
    // P2P state
    electron_1.ipcMain.handle('p2p:getState', () => p2pState);
    // P2P keypair
    electron_1.ipcMain.handle('p2p:getPublicKey', async () => {
        const keys = await initializeKeys();
        p2pState.publicKey = keys.publicKey;
        return keys.publicKey;
    });
    // File operations (for DataRoom)
    electron_1.ipcMain.handle('file:save', async (_event, options) => {
        const { canceled, filePath } = await electron_1.dialog.showSaveDialog(mainWindow, {
            defaultPath: options.defaultPath || options.filename,
            filters: [{ name: 'All Files', extensions: ['*'] }]
        });
        if (canceled || !filePath)
            return null;
        await fs.promises.writeFile(filePath, options.data);
        return filePath;
    });
    electron_1.ipcMain.handle('file:open', async (_event, options) => {
        const { canceled, filePaths } = await electron_1.dialog.showOpenDialog(mainWindow, {
            properties: [options?.multiple ? 'multiSelections' : 'openFile'],
            filters: options?.filters || [{ name: 'All Files', extensions: ['*'] }]
        });
        if (canceled || filePaths.length === 0)
            return null;
        if (options?.multiple) {
            return Promise.all(filePaths.map(async (fp) => ({
                path: fp,
                name: path.basename(fp),
                data: await fs.promises.readFile(fp)
            })));
        }
        return {
            path: filePaths[0],
            name: path.basename(filePaths[0]),
            data: await fs.promises.readFile(filePaths[0])
        };
    });
    // Crypto operations (native performance)
    electron_1.ipcMain.handle('crypto:generateKey', async () => {
        const key = crypto.randomBytes(32);
        return key.toString('base64');
    });
    electron_1.ipcMain.handle('crypto:hash', async (_event, data, algorithm = 'sha256') => {
        const hash = crypto.createHash(algorithm);
        hash.update(data);
        return hash.digest('hex');
    });
    electron_1.ipcMain.handle('crypto:encrypt', async (_event, options) => {
        const key = Buffer.from(options.key, 'base64');
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        const encrypted = Buffer.concat([
            cipher.update(Buffer.from(options.data)),
            cipher.final()
        ]);
        const authTag = cipher.getAuthTag();
        return {
            encrypted: encrypted.toString('base64'),
            iv: iv.toString('base64'),
            authTag: authTag.toString('base64')
        };
    });
    electron_1.ipcMain.handle('crypto:decrypt', async (_event, options) => {
        const key = Buffer.from(options.key, 'base64');
        const iv = Buffer.from(options.iv, 'base64');
        const authTag = Buffer.from(options.authTag, 'base64');
        const encrypted = Buffer.from(options.encrypted, 'base64');
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]);
        return decrypted.toString();
    });
    // Native Hyperswarm P2P operations
    let hyperswarm = null;
    electron_1.ipcMain.handle('hyperswarm:connect', async () => {
        if (hyperswarm)
            return hyperswarm.getPublicKey();
        try {
            const { HyperswarmNative } = require('./services/hyperswarm-native');
            hyperswarm = new HyperswarmNative();
            await hyperswarm.connect();
            // Forward events to renderer
            hyperswarm.on('peerConnected', (roomId, peer) => {
                p2pState.connectedPeers++;
                mainWindow?.webContents.send('hyperswarm:peerConnected', roomId, peer.id);
            });
            hyperswarm.on('peerDisconnected', (roomId, peerId) => {
                p2pState.connectedPeers = Math.max(0, p2pState.connectedPeers - 1);
                mainWindow?.webContents.send('hyperswarm:peerDisconnected', roomId, peerId);
            });
            hyperswarm.on('message', (roomId, peerId, message) => {
                mainWindow?.webContents.send('hyperswarm:message', roomId, peerId, message);
            });
            p2pState.isConnected = true;
            p2pState.publicKey = hyperswarm.getPublicKey();
            mainWindow?.webContents.send('p2p:state', p2pState);
            return hyperswarm.getPublicKey();
        }
        catch (error) {
            console.error('Failed to initialize Hyperswarm:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('hyperswarm:disconnect', async () => {
        if (!hyperswarm)
            return;
        await hyperswarm.disconnect();
        hyperswarm = null;
        p2pState.isConnected = false;
        p2pState.connectedPeers = 0;
        mainWindow?.webContents.send('p2p:state', p2pState);
    });
    electron_1.ipcMain.handle('hyperswarm:createRoom', async (_event, roomId) => {
        if (!hyperswarm)
            throw new Error('Hyperswarm not connected');
        const room = await hyperswarm.createRoom(roomId);
        return { id: room.id, peerCount: room.peers.size };
    });
    electron_1.ipcMain.handle('hyperswarm:joinRoom', async (_event, roomId) => {
        if (!hyperswarm)
            throw new Error('Hyperswarm not connected');
        const room = await hyperswarm.joinRoom(roomId);
        return { id: room.id, peerCount: room.peers.size };
    });
    electron_1.ipcMain.handle('hyperswarm:leaveRoom', async (_event, roomId) => {
        if (!hyperswarm)
            throw new Error('Hyperswarm not connected');
        await hyperswarm.leaveRoom(roomId);
    });
    electron_1.ipcMain.handle('hyperswarm:broadcast', async (_event, roomId, message) => {
        if (!hyperswarm)
            throw new Error('Hyperswarm not connected');
        hyperswarm.broadcast(roomId, message);
    });
    electron_1.ipcMain.handle('hyperswarm:sendToPeer', async (_event, roomId, peerId, message) => {
        if (!hyperswarm)
            throw new Error('Hyperswarm not connected');
        hyperswarm.sendToPeer(roomId, peerId, message);
    });
    electron_1.ipcMain.handle('hyperswarm:getPeers', async (_event, roomId) => {
        if (!hyperswarm)
            return [];
        return hyperswarm.getPeers(roomId).map((p) => ({ id: p.id, isInitiator: p.isInitiator }));
    });
    // Window controls (for frameless mode in RSE-Arqon)
    electron_1.ipcMain.on('window:minimize', () => mainWindow?.minimize());
    electron_1.ipcMain.on('window:maximize', () => {
        if (mainWindow?.isMaximized()) {
            mainWindow.unmaximize();
        }
        else {
            mainWindow?.maximize();
        }
    });
    electron_1.ipcMain.on('window:close', () => mainWindow?.close());
    // Notification
    electron_1.ipcMain.on('notification:show', (_event, options) => {
        const { Notification } = require('electron');
        new Notification(options).show();
    });
}
// App lifecycle
electron_1.app.whenReady().then(async () => {
    // Initialize keys
    try {
        const keys = await initializeKeys();
        p2pState.publicKey = keys.publicKey;
        console.log('P2P identity initialized');
    }
    catch (error) {
        console.error('Failed to initialize P2P keys:', error);
    }
    // Setup IPC before creating window
    setupIPCHandlers();
    // Create window
    createWindow();
    // Create tray
    createTray();
    // macOS: re-create window when dock icon clicked
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
        else {
            mainWindow?.show();
        }
    });
});
// Quit when all windows are closed (except on macOS)
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// Handle certificate errors in development
if (isDev) {
    electron_1.app.on('certificate-error', (event, _webContents, _url, _error, _certificate, callback) => {
        event.preventDefault();
        callback(true);
    });
}
// Graceful shutdown
electron_1.app.on('before-quit', () => {
    // Cleanup P2P connections
    console.log('Shutting down P2P connections...');
});
// Security: prevent new window creation
electron_1.app.on('web-contents-created', (_event, contents) => {
    contents.setWindowOpenHandler(() => {
        return { action: 'deny' };
    });
});
