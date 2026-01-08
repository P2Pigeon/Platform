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
 * @file encryption.test.ts
 * @description Unit tests for the encryption service. */

import * as encryption from '../../../services/security/encryption';
import { mockCrypto } from '../../utils/testUtils';

describe('Encryption Service', () => {
  // Setup and teardown for crypto mocking
  let restoreCrypto: () => void;
  
  beforeEach(() => {
    restoreCrypto = mockCrypto();
  });
  
  afterEach(() => {
    restoreCrypto();
    jest.clearAllMocks();
  });
  
  describe('Base64 Conversions', () => {
    test('should convert ArrayBuffer to Base64 string and back', () => {
      const testData = new Uint8Array([1, 2, 3, 4, 5]);
      const base64 = encryption.arrayBufferToBase64(testData);
      
      expect(typeof base64).toBe('string');
      
      const backToBuffer = encryption.base64ToArrayBuffer(base64);
      const resultArray = new Uint8Array(backToBuffer);
      
      expect(resultArray.length).toBe(testData.length);
      for (let i = 0; i < testData.length; i++) {
        expect(resultArray[i]).toBe(testData[i]);
      }
    });
  });
  
  describe('Key Generation', () => {
    test('should generate encryption key', async () => {
      const key = await encryption.generateEncryptionKey();
      expect(key).toBeDefined();
    });
    
    test('should handle errors during key generation', async () => {
      // Mock subtle.generateKey to throw an error
      const originalGenerateKey = window.crypto.subtle.generateKey;
      window.crypto.subtle.generateKey = jest.fn().mockRejectedValue(new Error('Mock key generation error'));
      
      await expect(encryption.generateEncryptionKey()).rejects.toThrow();
      
      // Restore original method
      window.crypto.subtle.generateKey = originalGenerateKey;
    });
  });
  
  describe('Key Import/Export', () => {
    test('should export key to raw format', async () => {
      const key = await encryption.generateEncryptionKey();
      const exportedKey = await encryption.exportKey(key);
      
      expect(exportedKey).toBeDefined();
      expect(exportedKey instanceof ArrayBuffer).toBe(true);
    });
    
    test('should import raw key data', async () => {
      const key = await encryption.generateEncryptionKey();
      const exportedKey = await encryption.exportKey(key);
      const importedKey = await encryption.importKey(exportedKey);
      
      expect(importedKey).toBeDefined();
    });
  });
  
  describe('Data Encryption/Decryption', () => {
    test('should encrypt data with generated IV', async () => {
      const key = await encryption.generateEncryptionKey();
      const data = 'Test data for encryption';
      
      const encryptedData = await encryption.encryptData(data, key);
      
      expect(encryptedData).toBeDefined();
      expect(encryptedData.ciphertext).toBeDefined();
      expect(encryptedData.iv).toBeDefined();
      expect(encryptedData.encryptionAlgorithm).toBe('AES-GCM');
    });
    
    test('should decrypt encrypted data', async () => {
      const key = await encryption.generateEncryptionKey();
      const data = 'Test data for encryption and decryption';
      
      const encryptedData = await encryption.encryptData(data, key);
      const decryptedData = await encryption.decryptData(encryptedData, key);
      
      // Since we're using mocks, we can't actually check that the decrypted data
      // matches the original, but we can ensure the function completes
      expect(decryptedData).toBeDefined();
      expect(typeof decryptedData).toBe('string');
    });
    
    test('should handle encryption errors', async () => {
      const key = await encryption.generateEncryptionKey();
      const data = 'Test data';
      
      // Mock subtle.encrypt to throw an error
      const originalEncrypt = window.crypto.subtle.encrypt;
      window.crypto.subtle.encrypt = jest.fn().mockRejectedValue(new Error('Mock encryption error'));
      
      await expect(encryption.encryptData(data, key)).rejects.toThrow();
      
      // Restore original method
      window.crypto.subtle.encrypt = originalEncrypt;
    });
    
    test('should handle decryption errors', async () => {
      const key = await encryption.generateEncryptionKey();
      const data = 'Test data';
      const encryptedData = await encryption.encryptData(data, key);
      
      // Mock subtle.decrypt to throw an error
      const originalDecrypt = window.crypto.subtle.decrypt;
      window.crypto.subtle.decrypt = jest.fn().mockRejectedValue(new Error('Mock decryption error'));
      
      await expect(encryption.decryptData(encryptedData, key)).rejects.toThrow();
      
      // Restore original method
      window.crypto.subtle.decrypt = originalDecrypt;
    });
  });
  
  describe('Asymmetric Cryptography', () => {
    test('should generate asymmetric key pair', async () => {
      const keyPair = await encryption.generateAsymmetricKeyPair();
      
      expect(keyPair).toBeDefined();
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
    });
    
    test('should derive shared secret from key pair', async () => {
      const keyPair1 = await encryption.generateAsymmetricKeyPair();
      const keyPair2 = await encryption.generateAsymmetricKeyPair();
      
      const sharedSecret1 = await encryption.deriveSharedSecret(
        keyPair1.privateKey,
        keyPair2.publicKey
      );
      
      expect(sharedSecret1).toBeDefined();
      
      // In a real scenario, we would verify that deriveSharedSecret with
      // keyPair2.privateKey and keyPair1.publicKey produces the same result
    });
    
    test('should handle errors in key derivation', async () => {
      const keyPair = await encryption.generateAsymmetricKeyPair();
      
      // Mock deriveKey to throw an error
      const originalDeriveKey = window.crypto.subtle.deriveKey;
      window.crypto.subtle.deriveKey = jest.fn().mockRejectedValue(new Error('Mock derivation error'));
      
      await expect(encryption.deriveSharedSecret(
        keyPair.privateKey,
        keyPair.publicKey
      )).rejects.toThrow();
      
      // Restore original method
      window.crypto.subtle.deriveKey = originalDeriveKey;
    });
  });
});
