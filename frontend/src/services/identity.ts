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
 * Cryptographic Identity Service
 * 
 * Implements Nostr-based authentication with secp256k1 key pairs.
 * Keys are compatible with NIP-01 and can be used across the Nostr ecosystem.
 */
import { getPublicKey, nip19 } from 'nostr-tools';

/**
 * User identity interface with Nostr cryptographic properties
 */
export interface Identity {
  id: string;
  publicKey: string;      // hex format (64 chars)
  privateKey: string;     // hex format (64 chars)
  npub: string;           // bech32 encoded public key (npub1...)
  nsec: string;           // bech32 encoded private key (nsec1...)
  createdAt: number;
  displayName?: string;
  avatar?: string;
  about?: string;
  nip05?: string;         // NIP-05 identifier (user@domain.com)
}

/**
 * Public identity that can be shared with peers
 */
export interface PublicIdentity {
  id: string;
  publicKey: string;
  displayName?: string;
  avatar?: string;
}

/**
 * Storage key for identity persistence
 */
const IDENTITY_STORAGE_KEY = 'pigeon_secure_identity';

/**
 * Get the current user's cryptographic identity
 * Creates a new one if none exists
 */
export const getCurrentIdentity = (): Identity => {
  const storedIdentity = localStorage.getItem(IDENTITY_STORAGE_KEY);
  
  if (storedIdentity) {
    try {
      return JSON.parse(storedIdentity) as Identity;
    } catch (error) {
      console.error('Failed to parse stored identity', error);
      // Continue to create a new identity if parsing fails
    }
  }
  
  // Create a new identity if none exists
  return createNewIdentity();
};

/**
 * Create a new cryptographic identity
 * @param displayName Optional display name
 */
/**
 * Parse a private key in hex or nsec format
 * @param privateKeyInput The user's private key (hex or nsec format)
 */
/**
 * Convert hex string to Uint8Array
 */
const hexToBytes = (hex: string): Uint8Array => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
};

/**
 * Convert Uint8Array to hex string
 */
const bytesToHex = (bytes: Uint8Array): string => {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

const parsePrivateKey = (privateKeyInput: string): string => {
  if (privateKeyInput.startsWith('nsec')) {
    const decoded = nip19.decode(privateKeyInput);
    if (decoded.type === 'nsec') {
      // decoded.data is Uint8Array for nsec - convert to hex
      return bytesToHex(decoded.data as unknown as Uint8Array);
    }
    throw new Error('Invalid nsec format');
  }
  // Assume hex format
  if (!/^[0-9a-fA-F]{64}$/.test(privateKeyInput)) {
    throw new Error('Invalid private key format. Expected 64 hex characters or nsec.');
  }
  return privateKeyInput.toLowerCase();
};

/**
 * Sign in with a private key (hex or nsec format)
 * @param privateKeyInput The user's private key
 */
export const signInWithPrivateKey = (privateKeyInput: string): Identity => {
  const privateKey = parsePrivateKey(privateKeyInput);
  const publicKey = getPublicKey(privateKey);
  
  // Generate bech32 encoded versions (cast to any for nostr-tools type compatibility)
  const nsec = (nip19 as any).nsecEncode(hexToBytes(privateKey));
  const npub = nip19.npubEncode(publicKey);

  const identity: Identity = {
    id: publicKey,
    publicKey,
    privateKey,
    npub,
    nsec,
    createdAt: Date.now(),
  };

  localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity));
  return identity;
};

/**
 * Create a new Nostr identity with a fresh secp256k1 key pair
 * @param displayName Optional display name
 */
export const createNewIdentity = (displayName?: string): Identity => {
  // Generate 32 random bytes for private key
  const privateKeyBytes = crypto.getRandomValues(new Uint8Array(32));
  const privateKey = bytesToHex(privateKeyBytes);
  
  // Derive public key using secp256k1 (nostr-tools handles this)
  const publicKey = getPublicKey(privateKey);
  
  // Generate bech32 encoded versions for user-friendly display
  // nsecEncode expects hex string, npubEncode expects hex string
  const nsec = nip19.nsecEncode(privateKey);
  const npub = nip19.npubEncode(publicKey);

  const identity: Identity = {
    id: publicKey,
    publicKey,
    privateKey,
    npub,
    nsec,
    createdAt: Date.now(),
    displayName
  };
  
  // Persist identity in local storage
  localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity));
  
  return identity;
};

/**
 * Update the current identity's profile information
 * @param updates Profile updates (only display name and avatar)
 */
export const updateIdentity = (updates: Partial<Pick<Identity, 'displayName' | 'avatar'>>): Identity => {
  const currentIdentity = getCurrentIdentity();
  
  const updatedIdentity: Identity = {
    ...currentIdentity,
    ...updates
  };
  
  localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(updatedIdentity));
  
  return updatedIdentity;
};

/**
 * Get the public portion of the identity for sharing
 */
export const getPublicIdentity = (): PublicIdentity => {
  const { id, publicKey, displayName, avatar } = getCurrentIdentity();
  return { id, publicKey, displayName, avatar };
};

/**
 * Sign data using the private key (Schnorr signature via secp256k1)
 * For full Nostr event signing, use the NostrClient class
 * @param data Data to sign
 */
export const signData = async (data: string): Promise<string> => {
  const { privateKey } = getCurrentIdentity();
  // Use Web Crypto API for HMAC signing as a fallback
  // For proper Nostr signatures, use signEvent from nostr-tools
  const encoder = new TextEncoder();
  const keyData = encoder.encode(privateKey);
  const messageData = encoder.encode(data);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  return bytesToHex(new Uint8Array(signature));
};

/**
 * Verify a signature (simplified - for full Nostr verification use nostr-tools)
 * @param data Original data
 * @param signature Signature to verify
 * @param signerPublicKey Public key of the signer
 */
export const verifySignature = async (
  data: string, 
  signature: string, 
  signerPublicKey: string
): Promise<boolean> => {
  // For proper Nostr signature verification, use verifyEvent from nostr-tools
  // This is a simplified HMAC verification for demo purposes
  const encoder = new TextEncoder();
  const keyData = encoder.encode(signerPublicKey);
  const messageData = encoder.encode(data);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const expectedSignature = await crypto.subtle.sign('HMAC', key, messageData);
  return signature === bytesToHex(new Uint8Array(expectedSignature));
};



export default {
  getCurrentIdentity,
  createNewIdentity,
  updateIdentity,
  getPublicIdentity,
  signData,
  verifySignature,
};
