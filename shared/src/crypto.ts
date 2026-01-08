/**
 * Cryptographic Identity & Secure Storage Utilities (Shared)
 * Extracted from frontend/src/services/identity.ts and frontend/src/utils/secureStorage.ts
 */
import * as CryptoJS from 'crypto-js';

// ---- Identity Types ----
export interface Identity {
  id: string;
  publicKey: string;
  privateKey: string;
  createdAt: number;
  displayName?: string;
  avatar?: string;
}

export interface PublicIdentity {
  id: string;
  publicKey: string;
  displayName?: string;
  avatar?: string;
}

// ---- Secure Storage Types ----
export interface StoredItem<T> {
  data: T;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
  version: string;
}

export interface StorageOptions {
  ttl?: number; // Time to live in ms
  encryptionKey?: string; // Custom encryption key (defaults to user's private key)
}

// ---- Secure Storage Helpers ----
export function getItem<T>(key: string, getCurrentIdentity: () => Identity, options?: StorageOptions): T | null {
  try {
    const encryptedData = localStorage.getItem(`secure_${key}`);
    if (!encryptedData) return null;
    const encryptionKey = options?.encryptionKey || getCurrentIdentity().privateKey;
    const decryptedString = CryptoJS.AES.decrypt(encryptedData, encryptionKey).toString(CryptoJS.enc.Utf8);
    if (!decryptedString) return null;
    const storedItem = JSON.parse(decryptedString) as StoredItem<T>;
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

export function setItem<T>(key: string, data: T, getCurrentIdentity: () => Identity, options?: StorageOptions): void {
  try {
    const encryptionKey = options?.encryptionKey || getCurrentIdentity().privateKey;
    const storedItem: StoredItem<T> = {
      data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt: options?.ttl ? Date.now() + options.ttl : undefined,
      version: '1.0.0',
    };
    const stringified = JSON.stringify(storedItem);
    const encrypted = CryptoJS.AES.encrypt(stringified, encryptionKey).toString();
    localStorage.setItem(`secure_${key}`, encrypted);
  } catch (error) {
    console.error(`Error setting secure storage item: ${key}`, error);
  }
}

export function removeItem(key: string): void {
  try {
    localStorage.removeItem(`secure_${key}`);
  } catch (error) {
    console.error(`Error removing secure storage item: ${key}`, error);
  }
}

export function clearSecureStorage(): void {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('secure_'))
      .forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing secure storage', error);
  }
}

export function createNamespace(namespace: string) {
  return {
    getItem: <T>(key: string, getCurrentIdentity: () => Identity, options?: StorageOptions) => getItem<T>(`${namespace}:${key}`, getCurrentIdentity, options),
    setItem: <T>(key: string, data: T, getCurrentIdentity: () => Identity, options?: StorageOptions) => setItem<T>(`${namespace}:${key}`, data, getCurrentIdentity, options),
    removeItem: (key: string) => removeItem(`${namespace}:${key}`),
  };
}

// ---- Crypto Helpers ----
export function signData(data: string, privateKey: string): string {
  // Simple HMAC-SHA256 signature for demonstration
  return CryptoJS.HmacSHA256(data, privateKey).toString();
}

export function verifySignature(data: string, signature: string, publicKey: string): boolean {
  // In a real implementation, use asymmetric crypto for verification
  // Here, we just hash the data+publicKey and compare for demonstration
  const expected = CryptoJS.HmacSHA256(data, publicKey).toString();
  return expected === signature;
}

export function signInWithPrivateKey(privateKey: string): Identity {
  const publicKey = CryptoJS.SHA256(privateKey).toString();
  const id = publicKey;
  const identity: Identity = {
    id,
    publicKey,
    privateKey,
    createdAt: Date.now(),
  };
  localStorage.setItem('pigeon_secure_identity', JSON.stringify(identity));
  return identity;
}
