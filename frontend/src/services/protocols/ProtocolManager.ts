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
 * Protocol Manager
 * 
 * Manages and coordinates different communication protocols (Hypernat, WebRTC, Nostr)
 * according to application needs and network conditions.
 * 
 * The Protocol Manager implements:
 * - Robust connection handling with automatic failover between protocols
 * - End-to-end encryption for secure communications
 * - Comprehensive file transfer capabilities with progress tracking
 * - Resource management to prevent memory leaks
 * - Performance monitoring and metrics
 * 
 * @module services/protocols
 */
import { 
  CommunicationProtocol,
  ConnectionStatus,
  Peer,
  Room,
  RoomId,
  Message,
  FileMetadata,
  FileId,
  PeerId,
  MessageId,
  TransferProgress,
  SecurityConfig,
  EncryptionKey,
  EncryptionAlgorithm,
  WebRTCConfig,
  NostrConfig,
  HypernatConfig,
  ConnectionMetrics,
  RoomEncryptionDetails,
  MediaStreamType
} from '../../types/core';
import { ProtocolAdapter, ProtocolEvents } from './ProtocolAdapter';
import { HyperswarmAdapter } from './HyperswarmAdapter';
import { WebRTCAdapter } from './WebRTCAdapter';

/**
 * Extended protocol events including internal manager events
 * 
 * These events are emitted by the ProtocolManager and can be subscribed to
 */
export interface ExtendedProtocolEvents {
  // Events forwarded from protocol adapters (with renamed event names)
  peerConnected: (peer: Peer) => void;
  peerDisconnected: (peerId: string) => void;
  peerStatusChanged: (peerId: string, status: ConnectionStatus) => void;
  messageReceived: (message: Message) => void;
  fileTransferProgress: (fileId: string, senderId: string, receiverId: string, progress: number) => void;
  fileTransferComplete: (fileId: string) => void;
  fileTransferError: (fileId: string, error: Error) => void;
  roomCreated: (room: Room) => void;
  roomJoined: (room: Room) => void;
  roomLeft: (roomId: string) => void;
  error: (error: Error) => void;
  
  // Additional internal manager events
  connectionStatusChanged: (data: { status: ConnectionStatus; protocol: CommunicationProtocol | null }) => void;
}

// Default configuration values
const DEFAULT_RECONNECT_ATTEMPTS = 5;
const DEFAULT_RECONNECT_DELAY = 1000;
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const DEFAULT_KEY_ROTATION_INTERVAL = 3600000; // 1 hour in ms

/**
 * Protocol Manager Configuration
 * Defines how the protocol manager should operate and coordinate between protocols
 */
export interface ProtocolManagerConfig {
  /**
   * Primary protocol to use for communication
   */
  primaryProtocol: CommunicationProtocol;
  
  /**
   * Fallback protocols in order of preference
   */
  fallbackProtocols: CommunicationProtocol[];
  
  /**
   * Whether to automatically reconnect on connection loss
   */
  autoReconnect: boolean;
  
  /**
   * Maximum reconnection attempts before giving up
   */
  maxReconnectAttempts: number;
  
  /**
   * Protocol-specific configurations
   */
  protocolConfigs: {
    [CommunicationProtocol.WEBRTC]?: WebRTCConfig;
    [CommunicationProtocol.HYPERSWARM]?: HypernatConfig;
  };
  
  /**
   * Security configuration
   */
  security: SecurityConfig;
  
  /**
   * Maximum file size for transfers in bytes
   */
  maxFileSize?: number;
  
  /**
   * Performance monitoring options
   */
  enablePerformanceMonitoring?: boolean;
  
  /**
   * Whether to automatically handle protocol failover
   */
  autoFailover?: boolean;
  
  /**
   * Logging level
   */
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'none';
}

/**
 * Protocol Manager Exception type
 */
export class ProtocolManagerError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ProtocolManagerError';
  }
}

/**
 * Protocol Manager class responsible for managing multiple communication protocols.
 * 
 * This manager coordinates between different protocol adapters (Hypernat, WebRTC, Nostr)
 * to provide seamless communication, automatic failover, and enhanced security.
 */
export class ProtocolManager {
  // Protocol adapters and management
  private adapters: Map<CommunicationProtocol, ProtocolAdapter> = new Map();
  private activeProtocol: CommunicationProtocol | null = null;
  private config: ProtocolManagerConfig;
  private isConnecting: boolean = false;
  private reconnectionAttempts: number = 0;
  private connectionRetryTimers: Map<string, number> = new Map();
  private eventHandlers: Map<keyof ExtendedProtocolEvents, Function[]> = new Map();
  private metrics: { 
    connectionTime: number;
    protocolMetrics: Map<CommunicationProtocol, ConnectionMetrics>;
  } = { connectionTime: 0, protocolMetrics: new Map() };
  private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;

  // Security related properties
  private roomKeys: Map<RoomId, EncryptionKey> = new Map();
  private keyRotationTimers: Map<RoomId, number> = new Map();

  // Performance monitoring
  private enablePerformanceMonitoring: boolean = false;

  /**
   * Initializes the Protocol Manager with provided configuration
   * @param config Configuration for the protocol manager
   */
  constructor(config: Partial<ProtocolManagerConfig> = {}) {
    this.config = this.validateConfig(config);
    this.enablePerformanceMonitoring = this.config.enablePerformanceMonitoring ?? false;
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    }
  }

  /**
   * Validates and normalizes the provided configuration
   * @param config The input configuration
   * @returns Validated and normalized configuration
   */
  private validateConfig(config: Partial<ProtocolManagerConfig>): ProtocolManagerConfig {
    const bootstrapServers = import.meta.env.VITE_HYPERNAT_BOOTSTRAP ? import.meta.env.VITE_HYPERNAT_BOOTSTRAP.split(',') : [];

    const defaultConfig: ProtocolManagerConfig = {
      primaryProtocol: CommunicationProtocol.HYPERSWARM,
      fallbackProtocols: [CommunicationProtocol.WEBRTC],
      autoReconnect: true,
      maxReconnectAttempts: DEFAULT_RECONNECT_ATTEMPTS,
      protocolConfigs: {
        [CommunicationProtocol.HYPERSWARM]: {
          bootstrap: bootstrapServers,
        },
        [CommunicationProtocol.WEBRTC]: {
          iceServers: [],
          maxRetries: 5,
          connectionTimeout: 10000,
        }
      },
      security: {
        enableE2EEncryption: true,
        encryptionAlgorithm: 'AES-GCM',
        keyRotationInterval: DEFAULT_KEY_ROTATION_INTERVAL,
        enablePFS: true,
      },
      maxFileSize: MAX_FILE_SIZE,
      enablePerformanceMonitoring: true,
      autoFailover: true,
      logLevel: 'info',
    };

    // Deep merge for protocolConfigs
    const protocolConfigs = {
      [CommunicationProtocol.HYPERSWARM]: {
        ...defaultConfig.protocolConfigs[CommunicationProtocol.HYPERSWARM],
        ...config.protocolConfigs?.[CommunicationProtocol.HYPERSWARM],
      },
      [CommunicationProtocol.WEBRTC]: {
        ...defaultConfig.protocolConfigs[CommunicationProtocol.WEBRTC],
        ...config.protocolConfigs?.[CommunicationProtocol.WEBRTC],
      },
    };

    const validatedConfig = {
      ...defaultConfig,
      ...config,
      protocolConfigs, // Use the deeply merged protocol configs
      security: {
        ...defaultConfig.security,
        ...config.security,
      }
    };

    if (!validatedConfig.primaryProtocol || !Object.values(CommunicationProtocol).includes(validatedConfig.primaryProtocol)) {
      throw new ProtocolManagerError('Invalid primary protocol specified', 'INVALID_CONFIG');
    }

    return validatedConfig as ProtocolManagerConfig;
  }

  /**
   * Initializes the Protocol Manager by setting up all configured protocol adapters
   */
  public async initialize(): Promise<void> {
    this.log('info', 'Initializing Protocol Manager...');
    await this.setupProtocolAdapters();
    this.log('info', 'Protocol Manager initialized successfully.');
  }

  /**
   * Simple logging utility
   * @param level Log level
   * @param message Message to log
   */
  private log(level: 'debug' | 'info' | 'warn' | 'error' | 'none', message: string): void {
    if (this.config.logLevel === 'none' || level === 'none') return;

    const logLevels = {
      'debug': 1,
      'info': 2,
      'warn': 3,
      'error': 4,
    };

    const configLogLevel = this.config.logLevel || 'info';
    if (logLevels[level] >= logLevels[configLogLevel]) {
      console[level](`[ProtocolManager] ${message}`);
    }
  }

  /**
   * Sets up protocol adapters based on configuration
   * @private
   */
  private async setupProtocolAdapters(): Promise<void> {
    const protocolsToSetup = [this.config.primaryProtocol, ...this.config.fallbackProtocols];
    const uniqueProtocols = [...new Set(protocolsToSetup)];

    for (const protocol of uniqueProtocols) {
      if (!this.adapters.has(protocol)) {
        const adapter = this.createProtocolAdapter(protocol);
        this.adapters.set(protocol, adapter);
      }
    }
  }

  /**
   * Creates and configures a protocol adapter for the specified protocol
   * @param protocol Protocol type to create adapter for
   * @returns The created and initialized adapter
   */
  private createProtocolAdapter(protocol: CommunicationProtocol): ProtocolAdapter {
    this.log('info', `Creating adapter for protocol: ${protocol}`);

    const config = this.config.protocolConfigs[protocol];
    if (!config) {
      throw new ProtocolManagerError(
        `Configuration for protocol '${protocol}' not found.`,
        'config_not_found'
      );
    }

    let adapter: ProtocolAdapter;
    switch (protocol) {
      case CommunicationProtocol.HYPERSWARM:
        adapter = new HyperswarmAdapter();
        break;
      case CommunicationProtocol.WEBRTC:
        adapter = new WebRTCAdapter();
        break;
      default:
        this.log('error', `Unknown protocol: ${protocol}. Using mock adapter.`);
        adapter = this.createTemporaryMockAdapter(protocol);
        break;
    }

    try {
      adapter.initialize(config);
      this.adapters.set(protocol, adapter);
      this.setupEventForwarding(adapter, protocol);
      return adapter;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ProtocolManagerError(
        `Failed to initialize adapter for protocol ${protocol}: ${message}`,
        'ADAPTER_INITIALIZATION_FAILED'
      );
    }
  }

  /**
   * Connects to the network using the primary protocol or falls back to alternatives
   * @returns Promise resolving when connected
   */
  public async connect(): Promise<void> {
    if (this.isConnecting) {
      this.log('warn', 'Connection attempt already in progress.');
      return;
    }
    this.isConnecting = true;
    this.connectionStatus = ConnectionStatus.CONNECTING;
    this.emit('connectionStatusChanged', { status: this.connectionStatus, protocol: null });

    try {
      await this.connectWithProtocol(this.config.primaryProtocol);
      this.reconnectionAttempts = 0;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log('error', `Primary protocol failed: ${message}. Trying fallbacks.`);
      if (this.config.autoFailover) {
        for (const fallback of this.config.fallbackProtocols) {
          try {
            await this.connectWithProtocol(fallback);
            this.reconnectionAttempts = 0;
            this.isConnecting = false;
            return;
          } catch (fallbackError) {
            const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
            this.log('error', `Fallback protocol ${fallback} failed: ${fallbackMessage}`);
          }
        }
      }
      this.isConnecting = false;
      this.connectionStatus = ConnectionStatus.ERROR;
      this.emit('connectionStatusChanged', { status: this.connectionStatus, protocol: null });
      throw new ProtocolManagerError('All connection attempts failed.', 'CONNECTION_FAILED');
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Connects using a specific protocol
   * @param protocol Protocol to connect with
   */
  private async connectWithProtocol(protocol: CommunicationProtocol): Promise<void> {
    const adapter = this.adapters.get(protocol);
    if (!adapter) {
      throw new ProtocolManagerError(`Adapter for protocol ${protocol} not found.`, 'ADAPTER_NOT_AVAILABLE');
    }

    this.log('info', `Connecting with ${protocol}...`);
    const startTime = performance.now();

    try {
      await adapter.connect();
      const connectionTime = Math.round(performance.now() - startTime);
      
      this.activeProtocol = protocol;
      this.connectionStatus = ConnectionStatus.CONNECTED;
      this.metrics.connectionTime = connectionTime;
      
      this.emit('connectionStatusChanged', { status: this.connectionStatus, protocol });
      this.log('info', `Connected successfully with ${protocol} in ${connectionTime}ms.`);

    } catch (error) {
      if (!this.metrics.protocolMetrics.has(protocol)) {
        this.metrics.protocolMetrics.set(protocol, {
          latency: 0,
          lastConnected: 0,
          connectionAttempts: 1,
          successfulConnections: 0,
          failedConnections: 1
        });
      } else {
        const metrics = this.metrics.protocolMetrics.get(protocol)!;
        metrics.connectionAttempts++;
        metrics.failedConnections++;
      }

      this.log('error', `Failed to connect with ${protocol}: ${error}`);
      throw error;
    }
  }

  /**
   * Returns the current local peer information
   */
  public getCurrentPeer(): Peer | null {
    if (!this.activeProtocol) {
      return null;
    }
    
    const adapter = this.adapters.get(this.activeProtocol);
    return adapter?.getCurrentPeer() || null;
  }

  /**
   * Creates a mock adapter for testing purposes
   * @param protocol The protocol type to mock
   * @returns A mock adapter implementing the ProtocolAdapter interface
   */
  private createTemporaryMockAdapter(protocol: CommunicationProtocol): ProtocolAdapter {
    const eventHandlers = new Map<keyof ProtocolEvents, Function[]>();
    const mockPeer: Peer = {
        id: 'mock-peer-id' as PeerId,
        displayName: 'Mock Peer',
        connectionStatus: ConnectionStatus.CONNECTED,
        protocolType: protocol,
        isLocal: true,
        lastSeen: new Date(),
    };

    return {
      // Required protocol type
      protocolType: protocol,
      
      // Connection management
      initialize: async () => {
        this.log('debug', `Mock ${protocol} adapter initialized`);
      },
      connect: async () => {
        this.log('debug', `Mock ${protocol} adapter connected`);
      },
      getConnectionStatus: () => ConnectionStatus.CONNECTED,
      disconnect: async () => {
        this.log('debug', `Mock ${protocol} adapter disconnected`);
      },
      sendMessage: async (roomId: string, content: string, contentType?: 'system' | 'text' | 'image' | 'file', replyToId?: string) => {
        this.log('info', `Mock ${protocol} adapter sent message to room ${roomId}`);
        const message: Message = {
          id: `mock-message-${Date.now()}` as MessageId,
          roomId: roomId as RoomId,
          senderId: mockPeer.id,
          content,
          contentType: contentType || 'text',
          timestamp: new Date(),
          isEncrypted: false,
          readBy: [mockPeer.id],
          ...(replyToId && { replyToId })
        };
        return message;
      },
      // Peer management
      getCurrentPeer: () => mockPeer,
      getPeers: () => [mockPeer],
      
      // Room management
      getRooms: () => [],
      createRoom: async (options?: Record<string, unknown>) => {
        const name = options?.name as string || 'Mock Room';
        const participants = options?.participants as Peer[] || [];
        const mockRoom: Room = {
            id: `mock-room-${Date.now()}` as RoomId,
            name,
            participants,
            createdAt: new Date(),
            createdBy: mockPeer.id,
            isEncrypted: true,
            protocolType: protocol,
            type: 'data',
        };
        return mockRoom;
      },
      joinRoom: async (roomId: RoomId) => {
        const mockRoom: Room = {
            id: roomId,
            name: 'Existing Mock Room',
            participants: [mockPeer],
            createdAt: new Date(),
            createdBy: 'another-peer' as PeerId,
            isEncrypted: true,
            protocolType: protocol,
            type: 'data',
        };
        return mockRoom;
      },
      leaveRoom: async (roomId: RoomId) => {
        this.log('info', `Mock ${protocol} adapter left room: ${roomId}`);
      },
      sendFile: async (roomId: string, file: File) => {
        this.log('info', `Mock ${protocol} sending file to room ${roomId}`);
        return `mock-file-${Math.random().toString(36).substring(2, 9)}`;
      },
      // Missing adapter methods for full interface implementation
      deleteMessage: async (messageId: string): Promise<void> => {
        this.log('info', `Mock ${protocol} deleted message: ${messageId}`);
        // Return void as per interface requirement
      },
      cancelFileTransfer: async (fileId: string): Promise<void> => {
        this.log('info', `Mock ${protocol} cancelled file transfer: ${fileId}`);
        // Return void as per interface requirement
      },
      getAvailableFiles: (roomId: string): FileMetadata[] => {
        this.log('info', `Mock ${protocol} getting available files for room: ${roomId}`);
        return [];
      },
      downloadFile: async (fileId: string): Promise<Blob> => {
        this.log('info', `Mock ${protocol} downloading file: ${fileId}`);
        // Create a small empty blob for mock purposes
        return new Blob(['mock file content'], { type: 'application/octet-stream' });
      },
      // Media stream methods required by ProtocolAdapter interface
      startLocalStream: async (): Promise<MediaStream> => {
        this.log('info', `Mock ${protocol} starting local stream`);
        // Create a mock MediaStream (this is just for type safety)
        const mockStream = new MediaStream();
        return mockStream;
      },
      
      stopLocalStream: (): void => {
        this.log('info', `Mock ${protocol} stopping local stream`);
        // Nothing to actually stop in the mock implementation
      },
      
      getLocalStream: (): MediaStream | null => {
        this.log('info', `Mock ${protocol} getting local stream`);
        // Return null to indicate no stream is available in mock mode
        return null;
      },
      on: <K extends keyof ProtocolEvents>(eventName: K, listener: ProtocolEvents[K]) => {
        if (!eventHandlers.has(eventName)) {
          eventHandlers.set(eventName, []);
        }
        eventHandlers.get(eventName)?.push(listener as Function);
      },
      off: <K extends keyof ProtocolEvents>(eventName: K, listener: ProtocolEvents[K]) => {
        const listeners = eventHandlers.get(eventName);
        if (listeners) {
          const index = listeners.indexOf(listener as Function);
          if (index > -1) {
            listeners.splice(index, 1);
          }
        }
      },
      removeAllListeners: () => {
        // Clear all event handlers
        eventHandlers.clear();
      }
    };
  }

  /**
   * Emits an event to all registered handlers
   * @param eventName Name of the event to emit
   * @param args Arguments to pass to the event handlers
   */
  private emit<K extends keyof ExtendedProtocolEvents>(
    eventName: K,
    ...args: Parameters<ExtendedProtocolEvents[K]>
  ): void {
    const handlers = this.eventHandlers.get(eventName);
    if (!handlers) return;

    const startTime = this.enablePerformanceMonitoring ? performance.now() : 0;

    handlers.forEach(handler => {
      try {
        handler(...args);
      } catch (error) {
        this.log('error', `Error in event handler for ${String(eventName)}: ${error}`);
      }
    });

    if (this.enablePerformanceMonitoring) {
      const duration = performance.now() - startTime;
      if (duration > 50) { // Log slow event handlers
        this.log('warn', `Slow event handler for ${String(eventName)}: ${duration.toFixed(2)}ms`);
      }
    }
  }

  /**
   * Registers an event handler for the specified event
   * @param eventName Event to listen for
   * @param handler Function to call when the event occurs
   */
  public on<K extends keyof ExtendedProtocolEvents>(
    eventName: K,
    handler: ExtendedProtocolEvents[K]
  ): void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName)?.push(handler as Function);
  }

  /**
   * Unregisters an event handler
   * @param eventName Event to stop listening for
   * @param handler Handler to remove
   */
  public off<K extends keyof ExtendedProtocolEvents>(
    eventName: K,
    handler: ExtendedProtocolEvents[K]
  ): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      const index = handlers.indexOf(handler as Function);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
  
  /**
   * Starts the local media stream (camera/microphone)
   * @param audioDeviceId Optional specific audio device to use
   * @param videoDeviceId Optional specific video device to use
   * @returns Promise resolving to the MediaStream
   */
  public async startLocalStream(audioDeviceId?: string, videoDeviceId?: string): Promise<MediaStream> {
    if (!this.activeProtocol) {
      throw new ProtocolManagerError('No active protocol', 'NO_ACTIVE_PROTOCOL');
    }
    
    const adapter = this.adapters.get(this.activeProtocol);
    if (!adapter || !adapter.startLocalStream) {
      throw new ProtocolManagerError('Active adapter does not support local stream', 'UNSUPPORTED_OPERATION');
    }
    
    return adapter.startLocalStream(audioDeviceId, videoDeviceId);
  }

  /**
   * Stops the local media stream
   */
  public stopLocalStream(): void {
    if (!this.activeProtocol) return;
    
    const adapter = this.adapters.get(this.activeProtocol);
    if (adapter?.stopLocalStream) {
      adapter.stopLocalStream();
    }
  }

  /**
   * Gets the current local media stream
   * @returns The local MediaStream or null if not active
   */
  public getLocalStream(): MediaStream | null {
    if (!this.activeProtocol) return null;
    
    const adapter = this.adapters.get(this.activeProtocol);
    if (adapter?.getLocalStream) {
      return adapter.getLocalStream();
    }
    return null;
  }

  /**
   * Cleans up all resources and disconnects all adapters
   */
  public async cleanup(): Promise<void> {
    this.log('info', 'Cleaning up Protocol Manager resources');

    const disconnectPromises = Array.from(this.adapters.values()).map(adapter => 
      adapter.disconnect().catch(error => {
        this.log('error', `Error disconnecting adapter: ${error.message}`);
      })
    );

    await Promise.all(disconnectPromises);

    this.connectionRetryTimers.forEach(clearTimeout);
    this.connectionRetryTimers.clear();

    if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
    }

    this.isConnecting = false;
    this.activeProtocol = null;
    this.connectionStatus = ConnectionStatus.DISCONNECTED;
    this.adapters.clear();
    this.eventHandlers.clear();

    this.log('info', 'Protocol Manager cleanup complete');
  }
  
  /**
   * Handler for window beforeunload event to ensure cleanup
   */
  private handleBeforeUnload = (): void => {
    this.log('info', 'Page unloading, performing synchronous cleanup');
    this.disconnectAllSync();
  }
  
  /**
   * Synchronous disconnect for all adapters (used during page unload)
   */
  private disconnectAllSync(): void {
    this.log('info', 'Synchronously disconnecting all adapters');
    this.adapters.forEach(adapter => {
      try {
        adapter.disconnect();
        adapter.removeAllListeners();
      } catch (error) {
        this.log('error', `Error during sync disconnect: ${error}`);
      }
    });
    
    this.connectionRetryTimers.forEach(clearTimeout);
  }

  /**
   * Sets up event forwarding from protocol adapters to the manager
   * @param adapter Protocol adapter to forward events from
   * @param protocol Protocol type of the adapter
   * @private
   */
  private setupEventForwarding(adapter: ProtocolAdapter, protocol: CommunicationProtocol): void {
    const self = this;

    const forwardEvent = <K extends keyof ProtocolEvents>(
        adapterEventName: K,
        managerEventName: keyof ExtendedProtocolEvents
    ) => {
        adapter.on(adapterEventName, (...args: any[]) => {
            const castedManagerEventName = managerEventName as any;
            if (self.enablePerformanceMonitoring) {
                const startTime = performance.now();
                (self.emit as any)(castedManagerEventName, ...args);
                const duration = performance.now() - startTime;
                if (duration > 50) {
                    self.log('warn', `Slow event forwarding for ${protocol}:${String(adapterEventName)}: ${duration.toFixed(2)}ms`);
                }
            } else {
                (self.emit as any)(castedManagerEventName, ...args);
            }
        });
    };

    forwardEvent('onPeerConnect', 'peerConnected');
    forwardEvent('onPeerDisconnect', 'peerDisconnected');
    forwardEvent('onPeerStatusChange', 'peerStatusChanged');
    forwardEvent('onMessageReceived', 'messageReceived');
    forwardEvent('onFileTransferProgress', 'fileTransferProgress');
    forwardEvent('onFileTransferComplete', 'fileTransferComplete');
    forwardEvent('onFileTransferError', 'fileTransferError');
    forwardEvent('onRoomCreated', 'roomCreated');
    forwardEvent('onRoomJoined', 'roomJoined');
    forwardEvent('onRoomLeft', 'roomLeft');
    forwardEvent('onError', 'error');
  }
}
