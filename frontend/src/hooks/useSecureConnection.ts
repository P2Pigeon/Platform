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
 * useSecureConnection Hook
 * 
 * Custom hook for managing secure connections with monitoring. */
import { useState, useEffect, useCallback } from 'react';
import { useCommunication } from '../context/CommunicationContext';
import { ConnectionStatus, CommunicationProtocol } from '../types/core';

interface UseSecureConnectionOptions {
  /** Whether to auto-initialize on mount */
  autoInitialize?: boolean;
  /** Whether to auto-connect on mount */
  autoConnect?: boolean;
  /** Callback when connection is established */
  onConnected?: () => void;
  /** Callback when connection is lost */
  onDisconnected?: () => void;
  /** Callback when error occurs */
  onError?: (error: Error) => void;
}

interface UseSecureConnectionResult {
  /** Whether the connection is initialized */
  isInitialized: boolean;
  /** Whether the connection is connected */
  isConnected: boolean;
  /** Whether the connection is currently initializing */
  isInitializing: boolean;
  /** Whether the connection is currently connecting */
  isConnecting: boolean;
  /** The active protocol being used */
  activeProtocol: CommunicationProtocol | null;
  /** The current connection status */
  connectionStatus?: ConnectionStatus;
  /** Connection latency in milliseconds */
  latency: number;
  /** Initialize the connection */
  initialize: () => Promise<void>;
  /** Connect to the network */
  connect: () => Promise<void>;
  /** Disconnect from the network */
  disconnect: () => Promise<void>;
  /** Last error that occurred */
  error?: Error;
}

/**
 * Hook for managing secure peer-to-peer connections
 */
export const useSecureConnection = (
  options: UseSecureConnectionOptions = {}
): UseSecureConnectionResult => {
  const {
    autoInitialize = true,
    autoConnect = false,
    onConnected,
    onDisconnected,
    onError
  } = options;

  const {
    isInitialized: contextIsInitialized,
    isConnected: contextIsConnected,
    activeProtocol: contextActiveProtocol,
    connectionStatus,
    initialize: contextInitialize,
    connect: contextConnect,
    disconnect: contextDisconnect
  } = useCommunication();

  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [latency, setLatency] = useState<number>(0);
  const [error, setError] = useState<Error | undefined>(undefined);
  
  // Initialize connection
  const initialize = useCallback(async () => {
    try {
      setIsInitializing(true);
      setError(undefined);
      
      // Initialize with default protocol configuration (Hyperswarm for serverless P2P)
      await contextInitialize([{
        protocol: CommunicationProtocol.HYPERSWARM,
        enabled: true,
        config: {
          // Default config values
        }
      }]);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error during initialization');
      setError(error);
      if (onError) onError(error);
    } finally {
      setIsInitializing(false);
    }
  }, [contextInitialize, onError]);
  
  // Connect to network
  const connect = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(undefined);
      await contextConnect();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error during connection');
      setError(error);
      if (onError) onError(error);
    } finally {
      setIsConnecting(false);
    }
  }, [contextConnect, onError]);
  
  // Disconnect from network
  const disconnect = useCallback(async () => {
    try {
      await contextDisconnect();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error during disconnection');
      setError(error);
      if (onError) onError(error);
    }
  }, [contextDisconnect, onError]);
  
  // Auto-initialize on mount if enabled
  useEffect(() => {
    if (autoInitialize && !contextIsInitialized && !isInitializing) {
      initialize();
    }
  }, [autoInitialize, contextIsInitialized, initialize, isInitializing]);
  
  // Auto-connect after initialization if enabled
  useEffect(() => {
    if (autoConnect && contextIsInitialized && !contextIsConnected && !isConnecting) {
      connect();
    }
  }, [autoConnect, contextIsInitialized, contextIsConnected, connect, isConnecting]);
  
  // Handle connection status changes
  useEffect(() => {
    if (contextIsConnected) {
      if (onConnected) onConnected();
      
      // Start latency monitoring
      const interval = setInterval(() => {
        // In a real implementation, we would measure actual latency
        // This is a placeholder implementation
        setLatency(Math.floor(Math.random() * 100) + 20);
      }, 5000);
      
      return () => clearInterval(interval);
    } else {
      if (onDisconnected) onDisconnected();
    }
  }, [contextIsConnected, onConnected, onDisconnected]);
  
  return {
    isInitialized: contextIsInitialized,
    isConnected: contextIsConnected,
    isInitializing,
    isConnecting,
    activeProtocol: contextActiveProtocol,
    connectionStatus,
    latency,
    initialize,
    connect,
    disconnect,
    error
  };
};

export default useSecureConnection;
