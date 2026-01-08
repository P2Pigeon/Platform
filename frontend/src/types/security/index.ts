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
 * @file Security type definitions
 * @description Comprehensive type definitions for security features. */

// Strict type definitions for cryptographic operations
export type CryptographicHash = string;
export type PublicKey = string;
export type PrivateKey = string;

/**
 * Supported signature algorithms
 */
export enum SignatureAlgorithm {
  ED25519 = 'ed25519',
  ECDSA_P256 = 'ecdsa-p256',
  RSA_PSS = 'rsa-pss',
  // Support for post-quantum algorithms
  DILITHIUM = 'dilithium',
  FALCON = 'falcon'
}

/**
 * Supported key exchange algorithms
 */
export enum KeyExchangeAlgorithm {
  ECDH_P256 = 'ecdh-p256',
  X25519 = 'x25519',
  // Post-quantum key exchange
  KYBER = 'kyber',
  NTRU = 'ntru'
}

/**
 * Encryption key with proper typing
 */
export interface CryptoKeyData {
  keyMaterial: string;
  algorithm: string;
  extractable: boolean;
  keyUsages: Array<KeyUsage>;
}

/**
 * Strict null safety for key operations
 */
export interface KeyPair {
  publicKey: CryptoKeyData;
  privateKey?: CryptoKeyData | null; // Nullable with explicit annotation
}

/**
 * Enhanced zero-trust security configuration
 */
export interface ZeroTrustConfig {
  // Always require end-to-end encryption
  requireE2EEncryption: boolean;
  // Minimum encryption strength
  minimumEncryptionBits: number;
  // Maximum key lifetime in milliseconds
  maxKeyLifetime: number;
  // Perfect forward secrecy requirements
  requirePFS: boolean;
  // Audit logging configuration
  auditLogging: AuditLoggingConfig;
  // Permission verification
  verificationRequirements: VerificationRequirements;
}

/**
 * Audit logging configuration
 */
export interface AuditLoggingConfig {
  enabled: boolean;
  // Types of events to log
  loggedEvents: Array<SecurityEventType>;
  // Local-only for privacy
  localOnly: boolean;
  // Retention period in days
  retentionDays: number;
}

/**
 * Types of security events to log
 */
export enum SecurityEventType {
  KEY_GENERATION = 'key_generation',
  KEY_ROTATION = 'key_rotation',
  ENCRYPTION = 'encryption',
  DECRYPTION = 'decryption',
  SIGNATURE = 'signature',
  VERIFICATION = 'verification',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  PEER_CONNECTED = 'peer_connected',
  PEER_DISCONNECTED = 'peer_disconnected',
  ROOM_CREATED = 'room_created',
  ROOM_JOINED = 'room_joined',
  ROOM_LEFT = 'room_left'
}

/**
 * Identity verification requirements
 */
export interface VerificationRequirements {
  requirePeerVerification: boolean;
  verificationMethod: VerificationMethod;
  // Maximum time since last verification in milliseconds
  maxTimeSinceVerification: number;
  // Allowable verification methods
  allowedVerificationMethods: Array<VerificationMethod>;
}

/**
 * Peer verification methods
 */
export enum VerificationMethod {
  PUBLIC_KEY = 'public_key',
  QR_CODE = 'qr_code',
  PASSPHRASE = 'passphrase',
  OUT_OF_BAND = 'out_of_band',
  TRUSTED_INTRODUCTION = 'trusted_introduction'
}

/**
 * Encrypted message payload with strict typing
 */
export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  // Type discriminator for proper handling
  encryptionAlgorithm: string;
  // Authentication tag for AEAD ciphers
  authTag?: string;
  // Key identifier for key rotation
  keyId?: string;
  // Signature for message authenticity
  signature?: string;
  // Metadata for decryption (non-sensitive)
  metadata?: {
    timestamp: number;
    senderPublicKey: string;
    version: string;
  };
}
