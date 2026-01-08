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
 * @file encryption.ts
 * @description Zero-trust encryption implementation for P2P communications. */

import { EncryptionAlgorithm } from '../../types/core';
import { EncryptedPayload, KeyPair } from '../../types/security';

// Constants for encryption settings
const DEFAULT_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256; // bits
const IV_LENGTH = 12; // bytes
const AUTH_TAG_LENGTH = 16; // bytes
const KEY_ROTATION_INTERVAL = 1000 * 60 * 15; // 15 minutes

/**
 * Generate a random initialization vector (IV)
 * @returns Uint8Array containing random bytes
 */
export const generateIV = (): Uint8Array => {
  return window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
};

/**
 * Convert ArrayBuffer to Base64 string
 * @param buffer - Array buffer to convert
 * @returns Base64 encoded string
 */
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

/**
 * Convert Base64 string to ArrayBuffer
 * @param base64 - Base64 encoded string
 * @returns Decoded array buffer
 */
export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Generate a new encryption key
 * @param algorithm - Encryption algorithm to use
 * @returns Promise resolving to CryptoKey
 */
export const generateEncryptionKey = async (
  algorithm: EncryptionAlgorithm = 'AES-GCM'
): Promise<CryptoKey> => {
  try {
    const algo: AesKeyGenParams = {
      name: algorithm,
      length: KEY_LENGTH
    };

    return await window.crypto.subtle.generateKey(
      algo,
      true, // extractable
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    console.error('Failed to generate encryption key:', error);
    throw new Error(`Failed to generate encryption key: ${error}`);
  }
};

/**
 * Export CryptoKey to raw format
 * @param key - CryptoKey to export
 * @returns Promise resolving to ArrayBuffer containing key data
 */
export const exportKey = async (key: CryptoKey): Promise<ArrayBuffer> => {
  try {
    return await window.crypto.subtle.exportKey('raw', key);
  } catch (error) {
    console.error('Failed to export key:', error);
    throw new Error(`Failed to export key: ${error}`);
  }
};

/**
 * Import raw key data as CryptoKey
 * @param keyData - Raw key data
 * @param algorithm - Algorithm for the key
 * @returns Promise resolving to CryptoKey
 */
export const importKey = async (
  keyData: ArrayBuffer,
  algorithm: EncryptionAlgorithm = 'AES-GCM'
): Promise<CryptoKey> => {
  try {
    return await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: algorithm },
      true,
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    console.error('Failed to import key:', error);
    throw new Error(`Failed to import key: ${error}`);
  }
};

/**
 * Encrypt data with AES-GCM
 * @param data - Data to encrypt
 * @param key - CryptoKey for encryption
 * @param iv - Initialization vector (optional, generates random if not provided)
 * @returns Promise resolving to EncryptedPayload
 */
export const encryptData = async (
  data: string,
  key: CryptoKey,
  iv?: Uint8Array
): Promise<EncryptedPayload> => {
  try {
    // Generate IV if not provided
    const ivToUse = iv || generateIV();
    
    // Convert data to ArrayBuffer
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Encrypt the data
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(ivToUse),
        tagLength: AUTH_TAG_LENGTH * 8 // bits
      },
      key,
      dataBuffer
    );
    
    // Create and return encrypted payload
    const payload: EncryptedPayload = {
      ciphertext: arrayBufferToBase64(encryptedBuffer),
      iv: arrayBufferToBase64(new Uint8Array(ivToUse).buffer as ArrayBuffer),
      encryptionAlgorithm: 'AES-GCM',
      metadata: {
        timestamp: Date.now(),
        senderPublicKey: '',  // Should be set by caller
        version: '1.0'
      }
    };
    
    return payload;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error(`Encryption failed: ${error}`);
  }
};

/**
 * Decrypt AES-GCM encrypted data
 * @param encryptedPayload - Encrypted data payload
 * @param key - CryptoKey for decryption
 * @returns Promise resolving to decrypted string
 */
export const decryptData = async (
  encryptedPayload: EncryptedPayload,
  key: CryptoKey
): Promise<string> => {
  try {
    // Convert base64 data to ArrayBuffer
    const ciphertext = base64ToArrayBuffer(encryptedPayload.ciphertext);
    const iv = base64ToArrayBuffer(encryptedPayload.iv);
    
    // Decrypt the data
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv),
        tagLength: AUTH_TAG_LENGTH * 8 // bits
      },
      key,
      ciphertext
    );
    
    // Convert decrypted buffer to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error(`Decryption failed: ${error}`);
  }
};

/**
 * Generate asymmetric key pair for authentication and key exchange
 * @returns Promise resolving to KeyPair
 */
export const generateAsymmetricKeyPair = async (): Promise<{
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}> => {
  try {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'ECDH',
        namedCurve: 'P-256'
      },
      true, // extractable
      ['deriveKey', 'deriveBits']
    );
    
    return keyPair;
  } catch (error) {
    console.error('Failed to generate asymmetric key pair:', error);
    throw new Error(`Failed to generate asymmetric key pair: ${error}`);
  }
};

/**
 * Derive a shared secret from a private key and peer's public key
 * @param privateKey - Local private key
 * @param peerPublicKey - Peer's public key
 * @returns Promise resolving to derived symmetric key
 */
export const deriveSharedSecret = async (
  privateKey: CryptoKey,
  peerPublicKey: CryptoKey
): Promise<CryptoKey> => {
  try {
    // Derive the shared secret
    return await window.crypto.subtle.deriveKey(
      {
        name: 'ECDH',
        public: peerPublicKey
      },
      privateKey,
      {
        name: 'AES-GCM',
        length: KEY_LENGTH
      },
      true,
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    console.error('Failed to derive shared secret:', error);
    throw new Error(`Failed to derive shared secret: ${error}`);
  }
};
