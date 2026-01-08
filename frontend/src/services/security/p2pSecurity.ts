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
 * @file p2pSecurity.ts
 * @description Enhanced P2P security service implementing zero-trust principles. */

import {
  EncryptedPayload,
  SecurityEventType,
  VerificationMethod,
  ZeroTrustConfig
} from '../../types/security';
import { ConnectionStatus, Peer, PeerId } from '../../types/core';
import * as encryption from './encryption';

// Default zero-trust configuration
export const DEFAULT_ZERO_TRUST_CONFIG: ZeroTrustConfig = {
  requireE2EEncryption: true,
  minimumEncryptionBits: 256,
  maxKeyLifetime: 1000 * 60 * 15, // 15 minutes
  requirePFS: true, // Perfect Forward Secrecy
  auditLogging: {
    enabled: true,
    loggedEvents: [
      SecurityEventType.KEY_GENERATION,
      SecurityEventType.KEY_ROTATION,
      SecurityEventType.ENCRYPTION,
      SecurityEventType.DECRYPTION,
      SecurityEventType.PEER_CONNECTED,
      SecurityEventType.PEER_DISCONNECTED
    ],
    localOnly: true,
    retentionDays: 7
  },
  verificationRequirements: {
    requirePeerVerification: true,
    verificationMethod: VerificationMethod.PUBLIC_KEY,
    maxTimeSinceVerification: 1000 * 60 * 60 * 24, // 24 hours
    allowedVerificationMethods: [
      VerificationMethod.PUBLIC_KEY,
      VerificationMethod.QR_CODE,
      VerificationMethod.PASSPHRASE
    ]
  }
};

/**
 * Manages the cryptographic identity for a peer
 */
class CryptographicIdentity {
  private publicKey: CryptoKey | null = null;
  private privateKey: CryptoKey | null = null;
  private publicKeyString: string | null = null;
  
  /**
   * Generate a new identity
   */
  public async generate(): Promise<void> {
    const keyPair = await encryption.generateAsymmetricKeyPair();
    this.publicKey = keyPair.publicKey;
    this.privateKey = keyPair.privateKey;
    
    // Export public key for sharing
    if (this.publicKey) {
      const exportedPublicKey = await encryption.exportKey(this.publicKey);
      this.publicKeyString = encryption.arrayBufferToBase64(exportedPublicKey);
    }
    
    this.logSecurityEvent(SecurityEventType.KEY_GENERATION, {
      hasPublicKey: !!this.publicKey,
      hasPrivateKey: !!this.privateKey
    });
  }
  
  /**
   * Get the public key as a base64 string
   */
  public getPublicKeyString(): string | null {
    return this.publicKeyString;
  }
  
  /**
   * Derive a shared secret with another peer
   * @param peerPublicKeyString - Peer's public key as base64 string
   * @returns Promise resolving to the derived shared secret key
   */
  public async deriveSharedSecretWithPeer(peerPublicKeyString: string): Promise<CryptoKey | null> {
    if (!this.privateKey) {
      throw new Error("No private key available");
    }
    
    try {
      const peerPublicKeyData = encryption.base64ToArrayBuffer(peerPublicKeyString);
      const peerPublicKey = await window.crypto.subtle.importKey(
        'raw',
        peerPublicKeyData,
        {
          name: 'ECDH',
          namedCurve: 'P-256'
        },
        true,
        []
      );
      
      return await encryption.deriveSharedSecret(this.privateKey, peerPublicKey);
    } catch (error) {
      console.error("Failed to derive shared secret:", error);
      this.logSecurityEvent(SecurityEventType.KEY_GENERATION, {
        error: String(error),
        success: false
      });
      return null;
    }
  }
  
  /**
   * Log security events
   * @param eventType - Type of security event
   * @param details - Event details
   */
  private logSecurityEvent(eventType: SecurityEventType, details: Record<string, unknown>): void {
    if (DEFAULT_ZERO_TRUST_CONFIG.auditLogging.enabled && 
        DEFAULT_ZERO_TRUST_CONFIG.auditLogging.loggedEvents.includes(eventType)) {
      console.info(`[Security Event] ${eventType}:`, {
        timestamp: new Date().toISOString(),
        eventType,
        ...details
      });
      
      // In a real implementation, this would store logs securely
      // based on retention policy if not local-only
    }
  }
}

/**
 * Peer verification service for zero-trust security
 */
export class PeerVerificationService {
  private verifiedPeers: Map<PeerId, {
    verifiedAt: number;
    method: VerificationMethod;
    publicKey?: string;
  }> = new Map();
  
  private identity: CryptographicIdentity;
  private config: ZeroTrustConfig;
  
  constructor(config: ZeroTrustConfig = DEFAULT_ZERO_TRUST_CONFIG) {
    this.identity = new CryptographicIdentity();
    this.config = config;
    
    // Initialize identity
    this.identity.generate().catch(err => {
      console.error("Failed to generate identity:", err);
    });
  }
  
  /**
   * Get this peer's public key
   */
  public getPublicKey(): string | null {
    return this.identity.getPublicKeyString();
  }
  
  /**
   * Verify a peer using their public key
   * @param peerId - Unique identifier for the peer
   * @param publicKey - Peer's public key
   * @returns Whether verification was successful
   */
  public verifyPeerByPublicKey(peerId: PeerId, publicKey: string): boolean {
    if (!publicKey) {
      return false;
    }
    
    // In a real implementation, additional verification would occur here
    // such as checking against a trusted key registry or verification history
    
    this.verifiedPeers.set(peerId, {
      verifiedAt: Date.now(),
      method: VerificationMethod.PUBLIC_KEY,
      publicKey
    });
    
    return true;
  }
  
  /**
   * Check if a peer is verified and the verification is still valid
   * @param peerId - Unique identifier for the peer
   * @returns Whether the peer is currently verified
   */
  public isPeerVerified(peerId: PeerId): boolean {
    const peerVerification = this.verifiedPeers.get(peerId);
    
    if (!peerVerification) {
      return false;
    }
    
    const timeSinceVerification = Date.now() - peerVerification.verifiedAt;
    return timeSinceVerification <= this.config.verificationRequirements.maxTimeSinceVerification;
  }
  
  /**
   * Establish a secure connection with a peer
   * @param peer - Peer to connect with
   * @returns Promise resolving to connection status
   */
  public async establishSecureConnection(peer: Peer): Promise<ConnectionStatus> {
    try {
      // Verify peer if not already verified
      if (!this.isPeerVerified(peer.id) && peer.publicKey) {
        const verified = this.verifyPeerByPublicKey(peer.id, peer.publicKey);
        
        if (!verified) {
          console.error(`Failed to verify peer ${peer.id}`);
          return ConnectionStatus.ERROR;
        }
      }
      
      const peerVerification = this.verifiedPeers.get(peer.id);
      
      // If verification exists and has public key, establish shared secret
      if (peerVerification?.publicKey) {
        const sharedSecret = await this.identity.deriveSharedSecretWithPeer(peerVerification.publicKey);
        
        if (!sharedSecret) {
          console.error(`Failed to derive shared secret with peer ${peer.id}`);
          return ConnectionStatus.ERROR;
        }
        
        // In a real implementation, this shared secret would be used for session encryption
        return ConnectionStatus.CONNECTED;
      }
      
      return ConnectionStatus.ERROR;
    } catch (error) {
      console.error(`Error establishing secure connection with peer ${peer.id}:`, error);
      return ConnectionStatus.ERROR;
    }
  }
}

/**
 * Create a secure P2P messaging service
 * @param config - Zero-trust configuration
 * @returns Object containing secure messaging methods
 */
export const createSecureP2PMessaging = (config: ZeroTrustConfig = DEFAULT_ZERO_TRUST_CONFIG) => {
  const verificationService = new PeerVerificationService(config);
  const sessionKeys = new Map<PeerId, CryptoKey>();
  const pendingMessages = new Map<PeerId, string[]>();
  
  // Log security event
  const logEvent = (eventType: SecurityEventType, details: Record<string, unknown>) => {
    if (config.auditLogging.enabled && config.auditLogging.loggedEvents.includes(eventType)) {
      console.info(`[Security Event] ${eventType}:`, {
        timestamp: new Date().toISOString(),
        eventType,
        ...details
      });
    }
  };
  
  return {
    /**
     * Get the local peer's public key
     */
    getPublicKey: () => verificationService.getPublicKey(),
    
    /**
     * Connect securely with a peer
     * @param peer - Peer to connect with
     * @returns Promise resolving to connection status
     */
    connect: async (peer: Peer): Promise<ConnectionStatus> => {
      const status = await verificationService.establishSecureConnection(peer);
      logEvent(SecurityEventType.PEER_CONNECTED, {
        peerId: peer.id,
        status,
        successful: status === ConnectionStatus.CONNECTED
      });
      return status;
    },
    
    /**
     * Encrypt a message for a peer
     * @param peerId - Target peer ID
     * @param message - Message to encrypt
     * @returns Promise resolving to encrypted payload or null if encryption fails
     */
    encryptMessage: async (peerId: PeerId, message: string): Promise<EncryptedPayload | null> => {
      try {
        // Get session key or generate new one
        let sessionKey = sessionKeys.get(peerId);
        
        if (!sessionKey) {
          // In a real implementation, this would use the shared secret from key exchange
          sessionKey = await encryption.generateEncryptionKey();
          sessionKeys.set(peerId, sessionKey);
        }
        
        const encrypted = await encryption.encryptData(message, sessionKey);
        
        logEvent(SecurityEventType.ENCRYPTION, {
          peerId,
          success: true
        });
        
        return encrypted;
      } catch (error) {
        console.error(`Failed to encrypt message for peer ${peerId}:`, error);
        
        logEvent(SecurityEventType.ENCRYPTION, {
          peerId,
          success: false,
          error: String(error)
        });
        
        return null;
      }
    },
    
    /**
     * Decrypt a message from a peer
     * @param peerId - Source peer ID
     * @param encryptedPayload - Encrypted message payload
     * @returns Promise resolving to decrypted message or null if decryption fails
     */
    decryptMessage: async (peerId: PeerId, encryptedPayload: EncryptedPayload): Promise<string | null> => {
      try {
        const sessionKey = sessionKeys.get(peerId);
        
        if (!sessionKey) {
          // Store message for later decryption once we have a key
          const pending = pendingMessages.get(peerId) || [];
          pending.push(encryptedPayload.ciphertext);
          pendingMessages.set(peerId, pending);
          
          throw new Error(`No session key available for peer ${peerId}`);
        }
        
        const decrypted = await encryption.decryptData(encryptedPayload, sessionKey);
        
        logEvent(SecurityEventType.DECRYPTION, {
          peerId,
          success: true
        });
        
        return decrypted;
      } catch (error) {
        console.error(`Failed to decrypt message from peer ${peerId}:`, error);
        
        logEvent(SecurityEventType.DECRYPTION, {
          peerId,
          success: false,
          error: String(error)
        });
        
        return null;
      }
    }
  };
};
