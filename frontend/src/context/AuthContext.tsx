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
 * Authentication Context
 * 
 * Implements anonymous-first authentication with cryptographic identities.
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  getCurrentIdentity, 
  createNewIdentity, 
  updateIdentity, 
  getPublicIdentity,
  signInWithPrivateKey as signInWithPrivateKeyService,
  Identity,
  PublicIdentity
} from '../services/identity';
import secureStorage from '../utils/secureStorage';

/**
 * Authentication status enum
 */
export enum AuthStatus {
  LOADING = 'loading',
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
  GUEST = 'guest',
}

/**
 * Interface for the Authentication Context state and methods
 */
interface AuthContextType {
  /** Current authentication status */
  status: AuthStatus;
  /** Current user identity */
  identity?: Identity;
  /** Public identity for sharing */
  publicIdentity?: PublicIdentity;
  /** Whether authentication is in progress */
  isLoading: boolean;
  /** Create a new identity */
  createIdentity: (displayName?: string) => Promise<Identity>;
  /** Sign in with a private key */
  signInWithPrivateKey: (privateKey: string) => Promise<Identity>;
  /** Update identity profile */
  updateProfile: (updates: {displayName?: string; avatar?: string}) => Promise<Identity>;
  /** Sign out / reset identity */
  signOut: () => Promise<void>;
  /** Sign data with private key */
  signData: (data: string) => Promise<string>;
  /** Sign in as a guest without a key */
  signInAsGuest: () => Promise<void>;
}

/**
 * Default context state
 */
const defaultContext: AuthContextType = {
  status: AuthStatus.LOADING,
  isLoading: true,
  createIdentity: async () => {
    throw new Error('AuthContext not initialized');
  },
  signInWithPrivateKey: async () => {
    throw new Error('AuthContext not initialized');
  },
  updateProfile: async () => {
    throw new Error('AuthContext not initialized');
  },
  signOut: async () => {
    throw new Error('AuthContext not initialized');
  },
  signData: async () => {
    throw new Error('AuthContext not initialized');
  },
  signInAsGuest: async () => {
    throw new Error('AuthContext not initialized');
  },
};

// Create the context
const AuthContext = createContext<AuthContextType>(defaultContext);

/**
 * Props for the AuthProvider component
 */
interface AuthProviderProps {
  children: ReactNode;
  /** For testing: skip initial authentication */
  skipInitialAuth?: boolean;
}

/**
 * Authentication Provider component
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ 
  children,
  skipInitialAuth = false, 
}) => {
  // State
  const [status, setStatus] = useState<AuthStatus>(AuthStatus.LOADING);
  const [identity, setIdentity] = useState<Identity | undefined>();
  const [publicIdentity, setPublicIdentity] = useState<PublicIdentity | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Initialize authentication state
   */
  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      
      // Check for guest session first
      if (sessionStorage.getItem('pigeon_guest_session') === 'true') {
        setStatus(AuthStatus.GUEST);
        setIdentity(undefined);
        setPublicIdentity(undefined);
        setIsLoading(false);
        return;
      }

      // Check for existing identity
      try {
        const existingIdentity = getCurrentIdentity();
        setIdentity(existingIdentity);
        setPublicIdentity(getPublicIdentity());
        setStatus(AuthStatus.AUTHENTICATED);
      } catch (error) {
        // This is expected if no identity is stored
        setStatus(AuthStatus.UNAUTHENTICATED);
      }
    } catch (error) {
      console.error('Authentication initialization error', error);
      setStatus(AuthStatus.UNAUTHENTICATED);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign in with a private key
   */
  const signInWithPrivateKey = async (privateKey: string): Promise<Identity> => {
    setIsLoading(true);
    try {
      const newIdentity = signInWithPrivateKeyService(privateKey);
      setIdentity(newIdentity);
      setPublicIdentity(getPublicIdentity());
      setStatus(AuthStatus.AUTHENTICATED);
      return newIdentity;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a new identity
   */
  const createIdentity = async (displayName?: string): Promise<Identity> => {
    setIsLoading(true);
    try {
      const newIdentity = createNewIdentity(displayName);
      setIdentity(newIdentity);
      setPublicIdentity(getPublicIdentity());
      setStatus(AuthStatus.AUTHENTICATED);
      return newIdentity;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update identity profile information
   */
  const updateProfile = async (
    updates: {displayName?: string; avatar?: string}
  ): Promise<Identity> => {
    setIsLoading(true);
    try {
      const updatedIdentity = updateIdentity(updates);
      setIdentity(updatedIdentity);
      setPublicIdentity(getPublicIdentity());
      return updatedIdentity;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign out by resetting identity and clearing secure storage
   */
  const signInAsGuest = async (): Promise<void> => {
    setIsLoading(true);
    try {
      localStorage.removeItem('pigeon_secure_identity');
      secureStorage.clearSecureStorage();
      sessionStorage.setItem('pigeon_guest_session', 'true');
      
      setIdentity(undefined);
      setPublicIdentity(undefined);
      setStatus(AuthStatus.GUEST);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign out by resetting identity and clearing secure storage
   */
  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // This operation should be expanded in a real application
      // to properly clean up all user data and connections
      localStorage.removeItem('pigeon_secure_identity');
      secureStorage.clearSecureStorage();
      sessionStorage.removeItem('pigeon_guest_session');
      
      setIdentity(undefined);
      setPublicIdentity(undefined);
      setStatus(AuthStatus.UNAUTHENTICATED);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign data with the user's private key using Web Crypto API
   */
  const signData = async (data: string): Promise<string> => {
    if (!identity) {
      throw new Error('No identity available for signing');
    }

    const { privateKey } = identity;
    const timestamp = Date.now().toString();
    const payload = `${data}|${timestamp}`;
    
    // Use Web Crypto API for HMAC signing
    const encoder = new TextEncoder();
    const keyData = encoder.encode(privateKey);
    const messageData = encoder.encode(payload);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  // Initialize on mount
  useEffect(() => {
    if (!skipInitialAuth) {
      initializeAuth();
    }
  }, [skipInitialAuth]);

  // Provide the auth context
  const value: AuthContextType = {
    status,
    identity,
    publicIdentity,
    isLoading,
    createIdentity,
    signInWithPrivateKey,
    updateProfile,
    signOut,
    signData,
    signInAsGuest,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use the auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
