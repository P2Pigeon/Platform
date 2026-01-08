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
 * Platform Detection Utilities
 * 
 * Detects the current runtime environment (Electron, Web, RSE-Arqon)
 * and provides platform-specific API access.
 */

// Electron API types (from preload)
interface PigeonElectronAPI {
  getAppInfo: () => Promise<{
    version: string;
    name: string;
    platform: string;
    arch: string;
    isRSEArqon: boolean;
    isDev: boolean;
  }>;
  getConfig: () => Promise<{
    serverUrl: string;
    autoStart: boolean;
    minimizeToTray: boolean;
    theme: 'dark' | 'light' | 'system';
  }>;
  setConfig: (config: Record<string, unknown>) => Promise<unknown>;
  p2p: {
    getState: () => Promise<{
      publicKey: string | null;
      isConnected: boolean;
      connectedPeers: number;
    }>;
    getPublicKey: () => Promise<string>;
    onStateChange: (callback: (state: unknown) => void) => () => void;
  };
  file: {
    save: (data: Buffer | string, filename: string, defaultPath?: string) => Promise<string | null>;
    open: (options?: {
      filters?: Array<{ name: string; extensions: string[] }>;
      multiple?: boolean;
    }) => Promise<unknown>;
  };
  crypto: {
    generateKey: () => Promise<string>;
    hash: (data: Buffer | string, algorithm?: string) => Promise<string>;
    encrypt: (data: Buffer | string, key: string) => Promise<{
      encrypted: string;
      iv: string;
      authTag: string;
    }>;
    decrypt: (encrypted: string, key: string, iv: string, authTag: string) => Promise<string>;
  };
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
  };
  notification: {
    show: (title: string, body: string) => void;
  };
  platform: {
    isElectron: boolean;
    isRSEArqon: boolean;
    isMac: boolean;
    isWindows: boolean;
    isLinux: boolean;
  };
}

declare global {
  interface Window {
    pigeon?: PigeonElectronAPI;
    electronVersion?: string;
  }
}

/**
 * Platform detection
 */
export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && window.pigeon?.platform?.isElectron === true;
};

export const isRSEArqon = (): boolean => {
  return typeof window !== 'undefined' && window.pigeon?.platform?.isRSEArqon === true;
};

export const isWeb = (): boolean => {
  return !isElectron();
};

export const isMobile = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const getPlatformName = (): string => {
  if (isRSEArqon()) return 'RSE-Arqon';
  if (isElectron()) return 'Desktop';
  if (isMobile()) return 'Mobile';
  return 'Web';
};

/**
 * Get Electron API if available
 */
export const getElectronAPI = (): PigeonElectronAPI | null => {
  if (isElectron() && window.pigeon) {
    return window.pigeon;
  }
  return null;
};

/**
 * Platform-specific file operations
 */
export const saveFile = async (
  data: Blob | ArrayBuffer | string,
  filename: string
): Promise<void> => {
  const electronAPI = getElectronAPI();
  
  if (electronAPI) {
    // Use native file dialog in Electron
    let fileData: Buffer | string;
    if (data instanceof Blob) {
      const arrayBuffer = await data.arrayBuffer();
      fileData = Buffer.from(arrayBuffer);
    } else if (data instanceof ArrayBuffer) {
      fileData = Buffer.from(data);
    } else {
      fileData = data;
    }
    
    await electronAPI.file.save(fileData, filename);
  } else {
    // Web fallback - use download link
    const blob = data instanceof Blob ? data : new Blob([data]);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export const openFile = async (
  options?: {
    accept?: string;
    multiple?: boolean;
  }
): Promise<File[]> => {
  const electronAPI = getElectronAPI();
  
  if (electronAPI) {
    // Use native file dialog in Electron
    const filters = options?.accept
      ? [{ name: 'Files', extensions: options.accept.split(',').map(ext => ext.trim().replace('.', '')) }]
      : undefined;
    
    const result = await electronAPI.file.open({ filters, multiple: options?.multiple });
    
    if (!result) return [];
    
    const files = Array.isArray(result) ? result : [result];
    return files.map((f: { name: string; data: Buffer }) => 
      new File([f.data], f.name)
    );
  } else {
    // Web fallback - use file input
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      if (options?.accept) input.accept = options.accept;
      if (options?.multiple) input.multiple = true;
      
      input.onchange = () => {
        const files = Array.from(input.files || []);
        resolve(files);
      };
      
      input.click();
    });
  }
};

/**
 * Platform-specific crypto operations
 */
export const generateKey = async (): Promise<string> => {
  const electronAPI = getElectronAPI();
  
  if (electronAPI) {
    return electronAPI.crypto.generateKey();
  } else {
    // Web fallback - use SubtleCrypto
    const key = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    const exported = await window.crypto.subtle.exportKey('raw', key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  }
};

export const hashData = async (data: string | ArrayBuffer, algorithm = 'SHA-256'): Promise<string> => {
  const electronAPI = getElectronAPI();
  
  if (electronAPI) {
    const inputData = typeof data === 'string' ? data : Buffer.from(data);
    return electronAPI.crypto.hash(inputData, algorithm.toLowerCase().replace('-', ''));
  } else {
    // Web fallback - use SubtleCrypto
    const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const hashBuffer = await window.crypto.subtle.digest(algorithm, buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
};

/**
 * Platform-specific notifications
 */
export const showNotification = (title: string, body: string): void => {
  const electronAPI = getElectronAPI();
  
  if (electronAPI) {
    electronAPI.notification.show(title, body);
  } else if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  } else if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(title, { body });
      }
    });
  }
};

/**
 * Window controls (for frameless Electron)
 */
export const windowControls = {
  minimize: () => getElectronAPI()?.window.minimize(),
  maximize: () => getElectronAPI()?.window.maximize(),
  close: () => getElectronAPI()?.window.close(),
  isAvailable: () => isElectron()
};

export default {
  isElectron,
  isRSEArqon,
  isWeb,
  isMobile,
  getPlatformName,
  getElectronAPI,
  saveFile,
  openFile,
  generateKey,
  hashData,
  showNotification,
  windowControls
};
