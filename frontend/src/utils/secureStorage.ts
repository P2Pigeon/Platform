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
 * Secure Storage Utility
 * 
 * Encrypted local storage with zero-trust architecture principles. */
import * as CryptoJS from 'crypto-js';
import { Identity, getCurrentIdentity } from '../services/identity';

/**
 * Interface for stored items with metadata
 */
interface StoredItem<T> {
  data: T;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
  version: string;
}

/**
 * Options for storage operations
 */
interface StorageOptions {
  /** TTL in milliseconds */
  ttl?: number;
  /** Custom encryption key (defaults to user's private key) */
  encryptionKey?: string;
}

// Current storage schema version
const STORAGE_VERSION = '1.0.0';

/**
 * Get an item from secure storage with decryption
 * @param key Storage key
 * @param options Storage options
 * @returns Decrypted data or null if not found/expired
 */
export function getItem<T>(key: string, options?: StorageOptions): T | null {
  try {
    const encryptedData = localStorage.getItem(`secure_${key}`);
    if (!encryptedData) return null;

    // Get encryption key
    const encryptionKey = options?.encryptionKey || getCurrentIdentity().privateKey;
    
    // Decrypt the data
    const decryptedString = CryptoJS.AES.decrypt(encryptedData, encryptionKey).toString(CryptoJS.enc.Utf8);
    if (!decryptedString) return null;
    
    // Parse and validate the stored item
    const storedItem = JSON.parse(decryptedString) as StoredItem<T>;
    
    // Check expiration
    if (storedItem.expiresAt && storedItem.expiresAt < Date.now()) {
      removeItem(key);
      return null;
    }
    
    return storedItem.data;
  } catch (error) {
    console.error(`Error retrieving secure storage item: ${key}`, error);
    return null;
  }
}

/**
 * Set an item in secure storage with encryption
 * @param key Storage key
 * @param data Data to store
 * @param options Storage options
 */
export function setItem<T>(key: string, data: T, options?: StorageOptions): void {
  try {
    // Get encryption key
    const encryptionKey = options?.encryptionKey || getCurrentIdentity().privateKey;
    
    // Create storage item with metadata
    const storedItem: StoredItem<T> = {
      data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: STORAGE_VERSION
    };
    
    // Set expiration if TTL provided
    if (options?.ttl) {
      storedItem.expiresAt = Date.now() + options.ttl;
    }
    
    // Encrypt and store
    const encryptedData = CryptoJS.AES.encrypt(
      JSON.stringify(storedItem),
      encryptionKey
    ).toString();
    
    localStorage.setItem(`secure_${key}`, encryptedData);
  } catch (error) {
    console.error(`Error setting secure storage item: ${key}`, error);
  }
}

/**
 * Remove an item from secure storage
 * @param key Storage key
 */
export function removeItem(key: string): void {
  localStorage.removeItem(`secure_${key}`);
}

/**
 * Clear all secure storage items
 */
export function clearSecureStorage(): void {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('secure_')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

/**
 * Create a namespace for grouping related secure storage items
 * @param namespace Namespace prefix
 */
export function createNamespace(namespace: string) {
  return {
    getItem: <T>(key: string, options?: StorageOptions): T | null => 
      getItem<T>(`${namespace}_${key}`, options),
    
    setItem: <T>(key: string, data: T, options?: StorageOptions): void => 
      setItem<T>(`${namespace}_${key}`, data, options),
    
    removeItem: (key: string): void => 
      removeItem(`${namespace}_${key}`),
    
    clearNamespace: (): void => {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(`secure_${namespace}_`)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  };
}

export default {
  getItem,
  setItem,
  removeItem,
  clearSecureStorage,
  createNamespace
};
