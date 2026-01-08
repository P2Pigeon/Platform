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
 * @file p2pSecurity.test.ts
 * @description Unit tests for the P2P security service. */

import { 
  PeerVerificationService, 
  createSecureP2PMessaging,
  DEFAULT_ZERO_TRUST_CONFIG
} from '../../../services/security/p2pSecurity';
import { ConnectionStatus } from '../../../types/core';
import { mockCrypto } from '../../utils/testUtils';

describe('P2P Security Service', () => {
  let restoreCrypto: () => void;
  
  beforeEach(() => {
    restoreCrypto = mockCrypto();
  });
  
  afterEach(() => {
    restoreCrypto();
    jest.clearAllMocks();
  });
  
  describe('PeerVerificationService', () => {
    let verificationService: PeerVerificationService;
    
    beforeEach(() => {
      verificationService = new PeerVerificationService();
    });
    
    test('should initialize with default config', () => {
      expect(verificationService).toBeDefined();
    });
    
    test('should generate public key on initialization', async () => {
      // Wait for async initialization to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      const publicKey = verificationService.getPublicKey();
      expect(publicKey).not.toBeNull();
    });
    
    test('should verify peer by public key', () => {
      const peerId = 'peer-123';
      const mockPublicKey = 'mock-public-key';
      
      const result = verificationService.verifyPeerByPublicKey(peerId, mockPublicKey);
      expect(result).toBe(true);
      
      const isVerified = verificationService.isPeerVerified(peerId);
      expect(isVerified).toBe(true);
    });
    
    test('should fail verification with empty public key', () => {
      const peerId = 'peer-123';
      const emptyKey = '';
      
      const result = verificationService.verifyPeerByPublicKey(peerId, emptyKey);
      expect(result).toBe(false);
      
      const isVerified = verificationService.isPeerVerified(peerId);
      expect(isVerified).toBe(false);
    });
    
    test('should check if peer verification has expired', async () => {
      const peerId = 'peer-123';
      const mockPublicKey = 'mock-public-key';
      
      // Verify the peer
      verificationService.verifyPeerByPublicKey(peerId, mockPublicKey);
      expect(verificationService.isPeerVerified(peerId)).toBe(true);
      
      // Mock the config to have a very short verification time
      const originalConfig = DEFAULT_ZERO_TRUST_CONFIG;
      const shortTimeConfig = {
        ...originalConfig,
        verificationRequirements: {
          ...originalConfig.verificationRequirements,
          maxTimeSinceVerification: 1 // 1ms
        }
      };
      
      // Create a new service with the short time config
      const shortTimeService = new PeerVerificationService(shortTimeConfig);
      shortTimeService.verifyPeerByPublicKey(peerId, mockPublicKey);
      
      // Wait for verification to expire
      await new Promise(resolve => setTimeout(resolve, 5));
      
      expect(shortTimeService.isPeerVerified(peerId)).toBe(false);
    });
    
    test('should establish secure connection with verified peer', async () => {
      const peerId = 'peer-123';
      const mockPublicKey = 'mock-public-key';
      
      // Create a peer object
      const peer = {
        id: peerId,
        publicKey: mockPublicKey,
        isLocal: false,
        connectionStatus: ConnectionStatus.DISCONNECTED,
        protocolType: 'webrtc' as any
      };
      
      // Verify the peer
      verificationService.verifyPeerByPublicKey(peerId, mockPublicKey);
      
      // Establish connection
      const status = await verificationService.establishSecureConnection(peer);
      expect(status).toBe(ConnectionStatus.CONNECTED);
    });
    
    test('should fail to establish connection with unverified peer', async () => {
      const peerId = 'peer-123';
      const peer = {
        id: peerId,
        isLocal: false,
        connectionStatus: ConnectionStatus.DISCONNECTED,
        protocolType: 'webrtc' as any
      };
      
      // Try to establish connection without verification
      const status = await verificationService.establishSecureConnection(peer);
      expect(status).toBe(ConnectionStatus.ERROR);
    });
  });
  
  describe('SecureP2PMessaging', () => {
    let secureMessaging: ReturnType<typeof createSecureP2PMessaging>;
    
    beforeEach(() => {
      secureMessaging = createSecureP2PMessaging();
    });
    
    test('should provide public key', () => {
      // Allow time for async key generation
      setTimeout(() => {
        const publicKey = secureMessaging.getPublicKey();
        expect(publicKey).not.toBeNull();
      }, 10);
    });
    
    test('should establish connection with peer', async () => {
      const peer = {
        id: 'peer-123',
        publicKey: 'mock-public-key',
        isLocal: false,
        connectionStatus: ConnectionStatus.DISCONNECTED,
        protocolType: 'webrtc' as any
      };
      
      const status = await secureMessaging.connect(peer);
      expect(status).toBe(ConnectionStatus.CONNECTED);
    });
    
    test('should encrypt message for peer', async () => {
      const peerId = 'peer-123';
      const message = 'This is a secure test message';
      
      const encryptedPayload = await secureMessaging.encryptMessage(peerId, message);
      expect(encryptedPayload).not.toBeNull();
      expect(encryptedPayload?.ciphertext).toBeDefined();
      expect(encryptedPayload?.iv).toBeDefined();
      expect(encryptedPayload?.encryptionAlgorithm).toBe('AES-GCM');
    });
    
    test('should decrypt message from peer', async () => {
      const peerId = 'peer-123';
      const message = 'This is a secure test message';
      
      // First encrypt a message to establish a session key
      const encryptedPayload = await secureMessaging.encryptMessage(peerId, message);
      
      // Then decrypt the message
      if (encryptedPayload) {
        const decryptedMessage = await secureMessaging.decryptMessage(peerId, encryptedPayload);
        expect(decryptedMessage).not.toBeNull();
      } else {
        fail('Encryption failed');
      }
    });
    
    test('should handle decryption without session key', async () => {
      // Try to decrypt a message without first establishing a session key
      const peerId = 'unknown-peer';
      const mockPayload = {
        ciphertext: 'encrypted-data',
        iv: 'mock-iv',
        encryptionAlgorithm: 'AES-GCM'
      };
      
      const result = await secureMessaging.decryptMessage(peerId, mockPayload as any);
      expect(result).toBeNull();
    });
  });
});
