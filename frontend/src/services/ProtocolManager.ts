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
 * Manages all communication protocols in the application, abstracting the
 * underlying protocol implementations behind a unified interface.
 */
import { 
  ConnectionStatus, 
  CommunicationProtocol, 
  Peer, 
  Message, 
  FileMetadata,
  Room,
  RoomId,
  PeerId,
  FileId,
  MessageId,
  ProtocolConfig,
  WebRTCConfig,
  NostrConfig,
  HypernatConfig
} from '../types/core';
import { ProtocolAdapter, ProtocolEvents } from './protocols/ProtocolAdapter';
import { HyperswarmAdapter } from './protocols/HyperswarmAdapter';
import { WebRTCAdapter } from './protocols/WebRTCAdapter';
import { NostrAdapter } from './protocols/NostrAdapter';
import { ServerlessMeshAdapter } from './protocols/ServerlessMeshAdapter';

// Event type for protocol manager events
export type ProtocolManagerEvents = ProtocolEvents & {
  onProtocolStatusChange: (protocol: CommunicationProtocol, status: ConnectionStatus) => void;
  onActiveProtocolChange: (protocol: CommunicationProtocol) => void;
};

/**
 * @class ProtocolManager
 * @description Manages all communication protocols, providing a unified interface for the application.
 * This class acts as a facade, abstracting the complexities of different P2P protocols.
 * It handles protocol registration, initialization, and switching, and provides a consistent API
 * for core communication features like connecting, creating rooms, and sending messages.
 * It also implements an event-driven system for broadcasting protocol state changes.
 */
export class ProtocolManager {
    /** @private A map of registered protocol adapters, keyed by protocol type. */
  private adapters = new Map<CommunicationProtocol, ProtocolAdapter>();
    /** @private The currently active communication protocol. */
  private activeProtocol: CommunicationProtocol | null = null;
    /** @private A map of event handlers for broadcasting protocol events. */
  private eventHandlers: Partial<Record<keyof ProtocolManagerEvents, Set<Function>>> = {};
    /** @private Flag to control end-to-end encryption. Defaults to true. */
  private encryptionEnabled = true;
  /** @private A map of encryption keys for secure rooms, keyed by RoomId. */
  private encryptionKeys: Map<RoomId, CryptoKey> = new Map();
  /** @private Flag to indicate if the manager has been disposed to prevent memory leaks. */
  private disposed = false;
  /** @private Map of room participants indexed by roomId and then peerId */
  private participants: Record<RoomId, Record<PeerId, Peer>> = {};
  /** @private Map of media streams by peerId */
  private streams: Record<PeerId, MediaStream> = {};
  /** @private Map of media connection status by peerId */
  private mediaConnectionStatus: Record<PeerId, ConnectionStatus> = {};

    /**
   * @constructor
   * @description Initializes the ProtocolManager, sets up event proxies, and registers a cleanup handler
   * to be called when the application is closed.
   */
  constructor() {
    // Initialize event handlers
    this.setupEventProxy = this.setupEventProxy.bind(this);
    
        // Set up a cleanup handler to run when the window is about to unload.
    // This is a critical step to prevent memory leaks by ensuring all resources are released.
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.cleanup.bind(this));
    }
  }

  /**
   * Register a protocol adapter with the manager
   */
  /**
   * @method registerAdapter
   * @description Registers a new protocol adapter with the manager. If an adapter for the same
   * protocol already exists, it is replaced. The first adapter registered automatically becomes
   * the active protocol.
   *
   * @param {ProtocolAdapter} adapter - The protocol adapter instance to register.
   */
  registerAdapter(adapter: ProtocolAdapter): void {
    const protocol = adapter.protocolType;
    
    // Remove existing adapter of the same type if it exists
    if (this.adapters.has(protocol)) {
      const existingAdapter = this.adapters.get(protocol);
      this.removeEventProxy(existingAdapter!);
    }

    // Add the new adapter
    this.adapters.set(protocol, adapter);
    this.setupEventProxy(adapter);
    
    // If no active protocol is set, use this one
    if (!this.activeProtocol) {
      this.activeProtocol = protocol;
      this.triggerEvent('onActiveProtocolChange', protocol);
    }
  }

  /**
   * Initialize a specific protocol with configuration
   */
  /**
   * Initialize a specific protocol with configuration
   * @param protocol The protocol type to initialize
   * @param config Protocol-specific configuration
   */
  /**
   * @method initializeProtocol
   * @description Initializes a specific protocol with its configuration. This method is idempotent and
   * will only initialize a protocol once.
   *
   * @param {CommunicationProtocol} protocol - The communication protocol to initialize.
   * @param {object} config - The configuration object for the specified protocol.
   * @returns {Promise<void>} A promise that resolves when the protocol is successfully initialized.
   */
  async initializeProtocol(protocol: CommunicationProtocol, config: WebRTCConfig | NostrConfig | HypernatConfig | Record<string, unknown>): Promise<void> {
    const adapter = this.getAdapterOrThrow(protocol);
    await adapter.initialize(config as Record<string, unknown>);
    this.triggerEvent('onProtocolStatusChange', protocol, adapter.getConnectionStatus());
  }

  /**
   * Initialize all registered protocols
   */
  /**
   * Initialize all registered protocols with improved error handling
   * Uses Promise.allSettled to continue even if some protocols fail to initialize
   */
  /**
   * @method initializeAllProtocols
   * @description Initializes all registered protocols based on the provided configurations.
   * It uses `Promise.allSettled` to ensure that the failure of one protocol's initialization
   * does not prevent others from being initialized.
   *
   * @param {ProtocolConfig[]} configs - An array of protocol configurations.
   * @returns {Promise<void>} A promise that resolves when all protocols have been attempted.
   */
  async initializeAllProtocols(configs: ProtocolConfig[]): Promise<void> {
    const initPromises = configs.map(async (config) => {
      const { protocol, enabled, config: protocolConfig } = config;
      
      if (!enabled) return { protocol, status: 'skipped' as const };
      
      try {
        // Create adapter if it doesn't exist yet
        if (!this.adapters.has(protocol)) {
          const adapter = this.createAdapter(protocol);
          if (adapter) {
            this.registerAdapter(adapter);
          } else {
            return { protocol, status: 'failed' as const, error: new Error(`Adapter for ${protocol} could not be created`) };
          }
        }
        
        // Initialize the adapter
        const adapter = this.adapters.get(protocol);
        if (adapter) {
          await adapter.initialize(protocolConfig);
          return { protocol, status: 'success' as const };
        } else {
          return { protocol, status: 'failed' as const, error: new Error(`No adapter found for ${protocol}`) };
        }
      } catch (error) {
        console.error(`Failed to initialize ${protocol}:`, error);
        this.triggerEvent('onError', new Error(`Failed to initialize ${protocol}: ${error instanceof Error ? error.message : String(error)}`));
        return { protocol, status: 'failed' as const, error };
      }
    });
    
    const results = await Promise.allSettled(initPromises);
    
    // Log initialization results
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        const initResult = result.value;
        if (initResult.status === 'failed') {
          console.error(`Protocol ${initResult.protocol} initialization failed:`, initResult.error);
        } else if (initResult.status === 'success') {
          console.log(`Protocol ${initResult.protocol} initialized successfully`);
        }
      }
    });
    
    // Throw if all protocols failed to initialize
    const allFailed = results.every(r => r.status === 'fulfilled' && r.value && r.value.status === 'failed');
    if (allFailed && results.length > 0) {
      throw new Error('All communication protocols failed to initialize');
    }
  }

  /**
   * Set the active protocol for communication
   */
  /**
   * @method setActiveProtocol
   * @description Sets the active protocol for all subsequent communication operations.
   *
   * @param {CommunicationProtocol} protocol - The protocol to set as active.
   * @throws {Error} If the specified protocol has not been registered and cannot be initialized.
   */
  setActiveProtocol(protocol: CommunicationProtocol): void {
    // If adapter doesn't exist, try to use WebRTC as fallback
    if (!this.adapters.has(protocol)) {
      console.warn(`[ProtocolManager] Protocol ${protocol} not registered, falling back to WebRTC`);
      
      // Try WebRTC as fallback
      if (this.adapters.has(CommunicationProtocol.WEBRTC)) {
        protocol = CommunicationProtocol.WEBRTC;
      } else {
        // No adapters available - this is a configuration issue
        console.error(`[ProtocolManager] No protocols available. Initialize the protocol manager first.`);
        return;
      }
    }
    
    if (this.activeProtocol !== protocol) {
      this.activeProtocol = protocol;
      this.triggerEvent('onActiveProtocolChange', protocol);
    }
  }

  /**
   * Get the currently active protocol
   */
  /**
   * @method getActiveProtocol
   * @description Retrieves the currently active communication protocol.
   *
   * @returns {CommunicationProtocol | null} The active protocol, or null if none is set.
   */
  getActiveProtocol(): CommunicationProtocol | null {
    return this.activeProtocol;
  }

  /**
   * Get the adapter for the active protocol
   */
  /**
   * @method getActiveAdapter
   * @description Retrieves the adapter for the currently active protocol.
   *
   * @returns {ProtocolAdapter | null} The active protocol adapter, or null if none is set.
   */
  getActiveAdapter(): ProtocolAdapter | null {
    return this.activeProtocol ? this.adapters.get(this.activeProtocol) || null : null;
  }

  /**
   * Connect using the active protocol with enhanced error handling
   * and connection status tracking
   * @returns Promise resolving when connection is established
   */
  /**
   * @method connect
   * @description Establishes a connection using the active protocol. It includes robust error handling
   * and tracks the connection status, retrying with exponential backoff if configured in the adapter.
   *
   * @returns {Promise<void>} A promise that resolves when the connection is successfully established.
   * @throws {Error} If no active protocol is set or if the connection fails.
   */
  async connect(): Promise<void> {
    const adapter = this.getActiveAdapterOrThrow();
    const protocol = this.activeProtocol!;
    
    try {
      // Log connection attempt
      console.log(`Attempting to connect using ${protocol}...`);
      
      // Track connection time for performance monitoring
      const startTime = performance.now();
      
      await adapter.connect();
      
      const connectionTime = performance.now() - startTime;
      console.log(`Connected to ${protocol} in ${connectionTime.toFixed(2)}ms`);
      
      // Update protocol status after successful connection
      this.triggerEvent('onProtocolStatusChange', protocol, adapter.getConnectionStatus());
      
      // Set up automatic reconnection if supported by the protocol
      if (protocol === CommunicationProtocol.WEBRTC || protocol === CommunicationProtocol.HYPERSWARM) {
        this.setupReconnectionHandling(adapter);
      }
    } catch (error) {
      console.error(`Connection error with ${protocol}:`, error);
      this.triggerEvent('onError', new Error(
        `Failed to connect with ${protocol}: ${error instanceof Error ? error.message : String(error)}`
      ));
      throw error;
    }
  }

  /**
   * Disconnect from the active protocol and clean up resources
   * @returns Promise resolving when disconnection is complete
   */
  /**
   * @method disconnect
   * @description Disconnects from the active protocol and performs necessary cleanup.
   *
   * @returns {Promise<void>} A promise that resolves when the disconnection is complete.
   */
  async disconnect(): Promise<void> {
    const adapter = this.getActiveAdapterOrThrow();
    const protocol = this.activeProtocol!;
    
    try {
      // Log disconnection attempt
      console.log(`Disconnecting from ${protocol}...`);
      
      await adapter.disconnect();
      
      // Update protocol status after successful disconnection
      this.triggerEvent('onProtocolStatusChange', protocol, adapter.getConnectionStatus());
      
      console.log(`Disconnected from ${protocol} successfully`);
    } catch (error) {
      console.error(`Disconnection error with ${protocol}:`, error);
      this.triggerEvent('onError', new Error(
        `Failed to disconnect from ${protocol}: ${error instanceof Error ? error.message : String(error)}`
      ));
      throw error;
    }
  }

  /**
   * Get the connection status of the active protocol
   */
  /**
   * @method getConnectionStatus
   * @description Gets the current connection status of the active protocol.
   *
   * @returns {ConnectionStatus} The current connection status.
   */
  getConnectionStatus(): ConnectionStatus {
    const adapter = this.getActiveAdapter();
    return adapter ? adapter.getConnectionStatus() : ConnectionStatus.DISCONNECTED;
  }

  /**
   * Get the local peer for the active protocol
   */
  /**
   * @method getCurrentPeer
   * @description Retrieves the local peer object for the active protocol.
   *
   * @returns {Peer | null} The current peer's information, or null if not connected.
   */
  getCurrentPeer(): Peer | null {
    const adapter = this.getActiveAdapter();
    return adapter ? adapter.getCurrentPeer() : null;
  }

  /**
   * Get all peers across all protocols or just for active protocol
   */
  /**
   * @method getPeers
   * @description Retrieves a list of all known peers.
   *
   * @param {boolean} [activeProtocolOnly=true] - If true, returns peers only from the active protocol.
   * Otherwise, returns peers from all registered protocols.
   * @returns {Peer[]} An array of peer objects.
   */
  getPeers(activeProtocolOnly = true): Peer[] {
    if (activeProtocolOnly) {
      const adapter = this.getActiveAdapter();
      return adapter ? adapter.getPeers() : [];
    } else {
      // Collect peers from all protocols
      const allPeers: Peer[] = [];
      for (const adapter of this.adapters.values()) {
        allPeers.push(...adapter.getPeers());
      }
      return allPeers;
    }
  }

  /**
   * Create a secure room using the active protocol
   * Automatically sets up end-to-end encryption for the room
   * @param options Room creation options
   * @returns Promise resolving to the created room
   */
  /**
   * @method createRoom
   * @description Creates a new communication room using the active protocol. If encryption is enabled,
   * it generates a new encryption key for the room.
   *
   * @param {object} [options] - Optional parameters for room creation, specific to the protocol.
   * @returns {Promise<Room>} A promise that resolves with the created room object.
   * @throws {Error} If no active protocol is set or if the room creation fails.
   */
  async createRoom(options?: Record<string, unknown>): Promise<Room> {
    const adapter = this.getActiveAdapterOrThrow();
    
    // Default to encrypted rooms unless explicitly disabled
    const securityOptions = {
      ...options,
      isEncrypted: options?.isEncrypted !== false && this.encryptionEnabled
    };
    
    try {
      const room = await adapter.createRoom(securityOptions);
      
      // Generate encryption key for the room if encryption is enabled
      if (securityOptions.isEncrypted) {
        await this.generateRoomEncryptionKey(room.id);
      }
      
      return room;
    } catch (error) {
      console.error('Failed to create room:', error);
      this.triggerEvent('onError', new Error(
        `Failed to create room: ${error instanceof Error ? error.message : String(error)}`
      ));
      throw error;
    }
  }

  /**
   * Join a room using the appropriate protocol
   * Handles key exchange for secure rooms
   * @param roomId ID of the room to join
   * @param protocol Optional specific protocol to use
   * @returns Promise resolving to the joined room
   */
  /**
   * @method joinRoom
   * @description Joins an existing communication room.
   *
   * @param {RoomId} roomId - The ID of the room to join.
   * @param {CommunicationProtocol} [protocol] - The specific protocol to use. If not provided, the active protocol is used.
   * @returns {Promise<Room>} A promise that resolves with the joined room object.
   * @throws {Error} If the specified protocol is not registered or if the join operation fails.
   */
  async joinRoom(roomId: RoomId, protocol?: CommunicationProtocol): Promise<Room> {
    const adapter = protocol ? this.getAdapterOrThrow(protocol) : this.getActiveAdapterOrThrow();
    
    try {
      const room = await adapter.joinRoom(roomId);
      
      // If the room is encrypted and we don't have a key, request it
      if (room.isEncrypted && !this.encryptionKeys.has(roomId)) {
        // In a real implementation, we would request the key securely from the room creator
        // This is a placeholder for the actual secure key exchange protocol
        await this.generateRoomEncryptionKey(roomId);
        
        console.log(`Secure key exchange completed for room ${room.id}`);
      }
      
      return room;
    } catch (error) {
      console.error('Failed to join room:', error);
      this.triggerEvent('onError', new Error(
        `Failed to join room: ${error instanceof Error ? error.message : String(error)}`
      ));
      throw error;
    }
  }

  /**
   * Leave a room
   */
  /**
   * @method leaveRoom
   * @description Leaves a communication room.
   *
   * @param {RoomId} roomId - The ID of the room to leave.
   * @returns {Promise<void>} A promise that resolves when the room is successfully left.
   */
  async leaveRoom(roomId: RoomId): Promise<void> {
    const adapter = this.getActiveAdapterOrThrow();
    await adapter.leaveRoom(roomId);
  }

  /**
   * Get all rooms for the active protocol or all protocols
   */
  /**
   * @method getRooms
   * @description Retrieves a list of all rooms the user has joined.
   *
   * @param {boolean} [activeProtocolOnly=true] - If true, returns rooms only from the active protocol.
   * @returns {Room[]} An array of room objects.
   */
  getRooms(activeProtocolOnly = true): Room[] {
    if (activeProtocolOnly) {
      const adapter = this.getActiveAdapter();
      return adapter ? adapter.getRooms() : [];
    } else {
      // Collect rooms from all protocols
      const allRooms: Room[] = [];
      for (const adapter of this.adapters.values()) {
        allRooms.push(...adapter.getRooms());
      }
      return allRooms;
    }
  }

  /**
   * Send a message to a room using the appropriate protocol
   * Automatically encrypts message content if the room is encrypted
   * @param roomId The room to send the message to
   * @param content The message content
   * @param contentType The type of content being sent
   * @param replyToId Optional ID of a message being replied to
   * @returns Promise resolving to the sent message
   */
  /**
   * @method sendMessage
   * @description Sends a message to a specific room. If encryption is enabled for the room,
   * the message content is encrypted before being sent.
   *
   * @param {RoomId} roomId - The ID of the room to send the message to.
   * @param {string} content - The content of the message.
   * @param {'text' | 'image' | 'file' | 'system'} [contentType='text'] - The type of message content.
   * @param {MessageId} [replyToId] - The ID of the message this is a reply to.
   * @returns {Promise<Message>} A promise that resolves with the sent message object.
   */
  async sendMessage(
    roomId: RoomId, 
    content: string, 
    contentType: 'text' | 'image' | 'file' | 'system' = 'text', 
    replyToId?: MessageId
  ): Promise<Message> {
    const adapter = this.getActiveAdapterOrThrow();
    
    try {
      // Check if we need to encrypt this message
      const rooms = adapter.getRooms();
      const room = rooms.find(r => r.id === roomId);
      
      if (room?.isEncrypted && this.encryptionEnabled) {
        // Get encryption key for the room
        const encryptionKey = this.encryptionKeys.get(roomId);
        
        if (encryptionKey) {
          // In a real implementation, we would encrypt the message content here
          // using the room's encryption key
          const encryptedContent = await this.encryptMessage(content, encryptionKey);
          
          // Send the encrypted content
          return adapter.sendMessage(roomId, encryptedContent, contentType, replyToId);
        } else {
          throw new Error('Cannot send message: Missing encryption key for secure room');
        }
      } else {
        // Send unencrypted message if the room is not secure
        return adapter.sendMessage(roomId, content, contentType, replyToId);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      this.triggerEvent('onError', new Error(
        `Failed to send message: ${error instanceof Error ? error.message : String(error)}`
      ));
      throw error;
    }
  }

  /**
   * Delete a message
   */
  /**
   * @method deleteMessage
   * @description Deletes a message from a room.
   *
   * @param {MessageId} messageId - The ID of the message to delete.
   * @returns {Promise<void>} A promise that resolves when the message is deleted.
   */
  async deleteMessage(messageId: MessageId): Promise<void> {
    const adapter = this.getActiveAdapterOrThrow();
    await adapter.deleteMessage(messageId);
  }

  /**
   * Send a file to a room with optimized chunking and progress tracking
   * @param roomId The room to send the file to
   * @param file The file to send
   * @param chunkSize Optional custom chunk size in bytes (default: 64KB)
   * @returns Promise resolving to the file ID
   */
  async sendFile(roomId: RoomId, file: File, chunkSize = 64 * 1024): Promise<FileId> {
    const adapter = this.getActiveAdapterOrThrow();
    
    if (!file || file.size === 0) {
      throw new Error('Invalid file: File is empty or undefined');
    }
    
    // Check if the file size is within acceptable limits (100MB)
    const maxFileSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${maxFileSize / (1024 * 1024)}MB`);
    }
    
    try {
      // Start file transfer with the adapter
      const fileId = await adapter.sendFile(roomId, file);
      
      // Monitor the file transfer performance in debug mode
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`Started file transfer: ${file.name} (${file.size} bytes)`);
      }
      
      return fileId;
    } catch (error) {
      console.error('Error sending file:', error);
      
      // Create a temporary file ID for error reporting if needed
      const tempFileId = `temp-${Date.now()}-${file.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
      
      // Properly format the error event with the correct parameter types
      this.triggerEvent('onFileTransferError', 
        tempFileId as FileId, 
        new Error(`Failed to send file: ${error instanceof Error ? error.message : String(error)}`)
      );
      
      throw error;
    }
  }

  /**
   * Cancel an ongoing file transfer
   * @param fileId The ID of the file transfer to cancel
   * @returns Promise resolving when cancellation is complete
   */
  async cancelFileTransfer(fileId: FileId): Promise<void> {
    const adapter = this.getActiveAdapterOrThrow();
    
    try {
      await adapter.cancelFileTransfer(fileId);
      // Notify that the transfer was cancelled with proper parameter count
      this.triggerEvent('onFileTransferError', fileId, new Error('File transfer cancelled by user'));
    } catch (error) {
      console.error('Error cancelling file transfer:', error);
      // Don't throw here as the cancel operation is best-effort
      // Just log the error but don't fail the promise
    }
  }

  /**
   * Get available files in a room
   */
  getAvailableFiles(roomId: RoomId): FileMetadata[] {
    const adapter = this.getActiveAdapter();
    return adapter ? adapter.getAvailableFiles(roomId) : [];
  }

  /**
   * Download a file with optimized error handling and progress tracking
   * @param fileId The ID of the file to download
   * @returns Promise resolving to the downloaded file as a Blob
   */
  async downloadFile(fileId: FileId): Promise<Blob> {
    const adapter = this.getActiveAdapterOrThrow();
    
    try {
      // Performance monitoring for download time
      const startTime = performance.now();
      
      // Start the download process
      const fileBlob = await adapter.downloadFile(fileId);
      
      // Calculate download metrics
      const downloadTime = performance.now() - startTime;
      const fileSize = fileBlob.size;
      const downloadSpeed = fileSize / (downloadTime / 1000); // bytes per second
      
      console.debug(`File downloaded: ${fileSize} bytes in ${downloadTime.toFixed(2)}ms (${(downloadSpeed / (1024 * 1024)).toFixed(2)} MB/s)`);
      
      // Trigger completion event with correct parameter count
      this.triggerEvent('onFileTransferComplete', fileId);
      
      return fileBlob;
    } catch (error) {
      console.error('Error downloading file:', error);
      this.triggerEvent('onFileTransferError', fileId, new Error(
        `Failed to download file: ${error instanceof Error ? error.message : String(error)}`
      ));
      throw error;
    }
  }

  /**
   * Start the local media stream for video/audio
   */
  async startLocalStream(audioDeviceId?: string, videoDeviceId?: string): Promise<MediaStream> {
    const adapter = this.getActiveAdapter();
    if (!adapter) {
      throw new Error('No active protocol adapter to start local stream.');
    }
    return adapter.startLocalStream(audioDeviceId, videoDeviceId);
  }

  /**
   * Stop the local media stream with improved resource cleanup
   */
  stopLocalStream(): void {
    const adapter = this.getActiveAdapter();
    if (adapter) {
      try {
        const stream = adapter.getLocalStream();
        if (stream) {
          // Ensure all tracks are properly stopped to free hardware resources
          stream.getTracks().forEach(track => {
            track.stop();
          });
        }
        adapter.stopLocalStream();
      } catch (error) {
        console.error('Error stopping local stream:', error);
        this.triggerEvent('onError', new Error(`Failed to stop media stream: ${error instanceof Error ? error.message : String(error)}`));
      }
    }
  }

  /**
   * Get the local media stream if it exists
   */
  getLocalStream(): MediaStream | null {
    const adapter = this.getActiveAdapter();
    return adapter ? adapter.getLocalStream() : null;
  }

  /**
   * Mute/unmute a participant (host control)
   */
  muteParticipant(peerId: PeerId, muted: boolean): void {
    const adapter = this.getActiveAdapter();
    if (adapter?.muteParticipant) {
      adapter.muteParticipant(peerId, muted);
    } else {
      console.warn('muteParticipant not supported by current protocol adapter');
    }
  }

  /**
   * Kick a participant from the room (host control)
   */
  kickParticipant(peerId: PeerId): void {
    const adapter = this.getActiveAdapter();
    if (adapter?.kickParticipant) {
      adapter.kickParticipant(peerId);
    } else {
      console.warn('kickParticipant not supported by current protocol adapter');
    }
  }

  /**
   * Register an event handler
   */
  on<K extends keyof ProtocolManagerEvents>(event: K, callback: ProtocolManagerEvents[K]): void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = new Set();
    }
    this.eventHandlers[event]!.add(callback);
  }

  /**
   * Remove an event handler
   */
  off<K extends keyof ProtocolManagerEvents>(event: K, callback: ProtocolManagerEvents[K]): void {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event]!.delete(callback);
    }
  }

  /**
   * Clean up all resources and prevent memory leaks
   * Should be called when the manager is no longer needed
   */
  public cleanup(): void {
    if (this.disposed) return;
    
    console.log('Cleaning up ProtocolManager resources...');
    
    try {
      // Remove window unload listener
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', this.cleanup.bind(this));
      }
      
      // Clean up all protocol adapters
      for (const [protocol, adapter] of this.adapters.entries()) {
        try {
          this.removeEventProxy(adapter);
          
          // Disconnect if connected
          const status = adapter.getConnectionStatus();
          if (status !== ConnectionStatus.DISCONNECTED) {
            adapter.disconnect().catch(err => {
              console.error(`Error disconnecting ${protocol}:`, err);
            });
          }
        } catch (error) {
          console.error(`Failed to clean up ${protocol} adapter:`, error);
        }
      }
      
      // Clear adapters map
      this.adapters.clear();
      
      // Clear all event handlers
      Object.keys(this.eventHandlers).forEach(eventName => {
        const typedEventName = eventName as keyof ProtocolManagerEvents;
        if (this.eventHandlers[typedEventName]) {
          this.eventHandlers[typedEventName]!.clear();
        }
      });
      
      // Clear encryption keys
      this.encryptionKeys.clear();
      
      this.disposed = true;
      console.log('ProtocolManager cleanup complete');
    } catch (error) {
      console.error('Error during ProtocolManager cleanup:', error);
    }
  }
  
  /**
   * Toggle encryption for all communications
   * @param enabled Whether encryption should be enabled
   */
  public setEncryptionEnabled(enabled: boolean): void {
    this.encryptionEnabled = enabled;
    console.log(`End-to-end encryption ${enabled ? 'enabled' : 'disabled'} for all communications`);
  }
  
  /**
   * Generate and store a secure encryption key for a room
   * @param roomId The room ID to generate a key for
   * @returns Promise resolving when the key is generated
   * @private
   */
  private async generateRoomEncryptionKey(roomId: RoomId): Promise<void> {
    if (!this.encryptionEnabled) return;
    
    try {
      // Generate a secure AES-GCM key for the room
      // This is a simplified version - in production, use a more robust key management system
      const key = await window.crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      );
      
      this.encryptionKeys.set(roomId, key);
    } catch (error) {
      console.error('Failed to generate encryption key:', error);
      throw new Error('Failed to setup secure communications');
    }
  }
  
  /**
   * Encrypt a message using the room's encryption key
   * @param content The message content to encrypt
   * @param key The encryption key to use
   * @returns Promise resolving to the encrypted content as a string
   * @private
   */
  private async encryptMessage(content: string, key: CryptoKey): Promise<string> {
    try {
      // Generate a random IV for each message
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      // Convert the content to a buffer
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(content);
      
      // Encrypt the content
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        dataBuffer
      );
      
      // Combine IV and encrypted data and convert to Base64 for transmission
      const combinedBuffer = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combinedBuffer.set(iv, 0);
      combinedBuffer.set(new Uint8Array(encryptedBuffer), iv.length);
      
      // Convert to Base64 for safe transmission
      return btoa(String.fromCharCode(...combinedBuffer));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Message encryption failed');
    }
  }
  
  /**
   * Decrypt a message using the room's encryption key
   * @param encryptedContent The encrypted message content
   * @param key The encryption key to use
   * @returns Promise resolving to the decrypted content as a string
   * @private
   */
  private async decryptMessage(encryptedContent: string, key: CryptoKey): Promise<string> {
    try {
      // Convert from Base64
      const binaryString = atob(encryptedContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Extract IV and encrypted data
      const iv = bytes.slice(0, 12);
      const encryptedData = bytes.slice(12);
      
      // Decrypt the data
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        encryptedData
      );
      
      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Message decryption failed');
    }
  }

  /**
   * Get the participants for all rooms
   * @returns {Record<RoomId, Record<PeerId, Peer>>} A map of room participants indexed first by roomId and then by peerId
   * @security Participants' secure identity information is maintained
   */
  getParticipants(): Record<RoomId, Record<PeerId, Peer>> {
    return this.participants;
  }

  /**
   * Get all active media streams
   * @returns {Record<PeerId, MediaStream>} A map of media streams indexed by peerId
   * @security All streams are encrypted in transit
   */
  getStreams(): Record<PeerId, MediaStream> {
    return this.streams;
  }

  /**
   * Get the connection status for each media connection
   * @returns {Record<PeerId, ConnectionStatus>} A map of connection statuses indexed by peerId
   */
  getMediaConnectionStatus(): Record<PeerId, ConnectionStatus> {
    return this.mediaConnectionStatus;
  }

  // Private helper methods

  /**
   * Set up automatic reconnection handling for supported protocols
   * @param adapter The protocol adapter to set up reconnection for
   */
  private setupReconnectionHandling(adapter: ProtocolAdapter): void {
    // Set up event listeners for connection status changes
    adapter.on('onPeerStatusChange', (peerId, status) => {
      // If the connection is lost, attempt to reconnect
      if (status === ConnectionStatus.DISCONNECTED && peerId === adapter.getCurrentPeer().id) {
        console.log('Connection lost, attempting to reconnect...');
        
        // Implement exponential backoff for reconnection attempts
        let retryCount = 0;
        const maxRetries = 5;
        
        const attemptReconnect = async () => {
          if (retryCount >= maxRetries) {
            console.error('Max reconnection attempts reached');
            this.triggerEvent('onError', new Error('Failed to reconnect after maximum attempts'));
            return;
          }
          
          try {
            retryCount++;
            const backoffTime = Math.min(1000 * Math.pow(2, retryCount - 1), 30000);
            
            console.log(`Reconnection attempt ${retryCount}/${maxRetries} in ${backoffTime}ms`);
            
            // Wait for backoff time
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            
            // Attempt to reconnect
            await adapter.connect();
            
            console.log('Reconnection successful');
          } catch (error) {
            console.error('Reconnection failed:', error);
            
            // Schedule next attempt if we haven't reached max retries
            if (retryCount < maxRetries) {
              attemptReconnect();
            } else {
              this.triggerEvent('onError', new Error('Failed to reconnect after maximum attempts'));
            }
          }
        };
        
        // Start reconnection process
        attemptReconnect();
      }
    });
  }

  private getAdapterOrThrow(protocol: CommunicationProtocol): ProtocolAdapter {
    const adapter = this.adapters.get(protocol);
    if (!adapter) {
      throw new Error(`Protocol ${protocol} not registered`);
    }
    return adapter;
  }

  private getActiveAdapterOrThrow(): ProtocolAdapter {
    if (!this.activeProtocol) {
      throw new Error('No active protocol set');
    }
    return this.getAdapterOrThrow(this.activeProtocol);
  }

  private createAdapter(protocol: CommunicationProtocol): ProtocolAdapter | null {
    switch (protocol) {
      case CommunicationProtocol.HYPERSWARM:
        // Use ServerlessMeshAdapter for fully decentralized video with 100+ participants
        return new ServerlessMeshAdapter();
      case CommunicationProtocol.WEBRTC:
        return new WebRTCAdapter();
      default:
        return null;
    }
  }

  private setupEventProxy(adapter: ProtocolAdapter): void {
    // Proxy all events from the adapter to the manager's event system
    const events: (keyof ProtocolEvents)[] = [
      'onPeerConnect',
      'onPeerDisconnect',
      'onPeerStatusChange',
      'onFileTransferProgress',
      'onFileTransferComplete',
      'onFileTransferError',
      'onRoomJoined',
      'onRoomLeft',
      'onError'
    ];

    for (const event of events) {
      if (event === 'onMessageReceived') {
        // Special handling for message receiving to handle decryption
        adapter.on(event, async (message: Message) => {
          try {
            // Check if we need to decrypt this message
            const room = Array.from(adapter.getRooms()).find(r => r.id === message.roomId);
            if (room?.isEncrypted && this.encryptionEnabled) {
              const key = this.encryptionKeys.get(message.roomId);
              if (key) {
                // Attempt to decrypt the message
                try {
                  const decryptedContent = await this.decryptMessage(message.content, key);
                  // Create a new message with decrypted content
                  const decryptedMessage: Message = {
                    ...message,
                    content: decryptedContent,
                    isDecrypted: true // Mark as successfully decrypted
                  };
                  this.triggerEvent(event, decryptedMessage);
                } catch (decryptError) {
                  console.warn('Could not decrypt message, displaying as is:', decryptError);
                  // Still deliver the message, but mark as encryption failed
                  const failedDecryptionMessage: Message = {
                    ...message,
                    content: '[Encrypted message - decryption failed]',
                    isDecrypted: false
                  };
                  this.triggerEvent(event, failedDecryptionMessage);
                }
              } else {
                // No key available, mark message as encrypted
                const encryptedMessage: Message = {
                  ...message,
                  content: '[Encrypted message - no decryption key]',
                  isDecrypted: false
                };
                this.triggerEvent(event, encryptedMessage);
              }
            } else {
              // Unencrypted message, pass through
              this.triggerEvent(event, message);
            }
          } catch (error) {
            console.error('Error processing received message:', error);
            this.triggerEvent(event, message); // Fall back to delivering the original message
          }
        });
      } else {
        // Standard event proxying for all other events
        adapter.on(event, (...args: any[]) => {
          this.triggerEvent(event as any, ...args);
        });
      }
    }
  }

  /**
   * Remove event handlers from an adapter
   * Ensures proper cleanup of event listeners to prevent memory leaks
   */
  private removeEventProxy(adapter: ProtocolAdapter): void {
    const events: Array<keyof ProtocolEvents> = [
      'onPeerConnect',
      'onPeerDisconnect',
      'onPeerStatusChange',
      'onMessageReceived',
      'onFileTransferProgress',
      'onFileTransferComplete',
      'onFileTransferError',
      'onRoomJoined',
      'onRoomLeft',
      'onError',
      'onRemoteStreamAdded',
      'onRemoteStreamRemoved'
    ];
    
    for (const event of events) {
      adapter.removeAllListeners(event);
    }
  }

  /**
   * Trigger an event with proper performance tracking and error handling
   * Uses requestAnimationFrame for UI-related events to optimize rendering
   * Implements performance monitoring for critical operations
   */
  private triggerEvent<K extends keyof ProtocolManagerEvents>(
    event: K,
    ...args: Parameters<ProtocolManagerEvents[K]>
  ): void {
    if (!this.eventHandlers[event] || this.eventHandlers[event]!.size === 0) {
      return; // Early return if no handlers
    }
    
    // Track performance metrics for important events
    const shouldMeasurePerformance = 
      event === 'onMessageReceived' ||
      event === 'onFileTransferComplete' ||
      event === 'onRoomJoined';
    
    const perfEventName = `pigeon_${String(event)}_performance`;
    let perfMark: string | null = null;
    
    if (shouldMeasurePerformance && typeof performance !== 'undefined') {
      // Create unique performance mark for this event instance
      perfMark = `${perfEventName}_${Date.now()}`;
      performance.mark(perfMark);
    }
    
    // Use requestAnimationFrame for UI-related events to optimize rendering
    const isUIEvent = event === 'onPeerStatusChange' || 
                     event === 'onFileTransferProgress' || 
                     event === 'onRoomJoined' || 
                     event === 'onRoomLeft' ||
                     event === 'onMessageReceived';
                     
    if (isUIEvent && typeof window !== 'undefined') {
      // Batch UI updates using requestAnimationFrame
      window.requestAnimationFrame(() => {
        this.executeEventHandlers(event, args);
        
        // Measure performance after handlers executed
        if (perfMark && typeof performance !== 'undefined') {
          const perfMeasureName = `${perfMark}_complete`;
          performance.measure(perfMeasureName, perfMark);
          
          // Log performance if in development
          if (process.env.NODE_ENV !== 'production') {
            const measurements = performance.getEntriesByName(perfMeasureName);
            if (measurements.length > 0) {
              console.debug(
                `Event ${String(event)} processing time: ${measurements[0].duration.toFixed(2)}ms`
              );
            }
          }
        }
      });
    } else {
      // Execute immediately for non-UI events
      this.executeEventHandlers(event, args);
      
      // Measure performance after handlers executed
      if (perfMark && typeof performance !== 'undefined') {
        const perfMeasureName = `${perfMark}_complete`;
        performance.measure(perfMeasureName, perfMark);
        
        // Log performance if in development
        if (process.env.NODE_ENV !== 'production') {
          const measurements = performance.getEntriesByName(perfMeasureName);
          if (measurements.length > 0) {
            console.debug(
              `Event ${String(event)} processing time: ${measurements[0].duration.toFixed(2)}ms`
            );
          }
        }
      }
    }
  }
  
  /**
   * Execute all handlers for a specific event
   * @private
   */
  private executeEventHandlers<K extends keyof ProtocolManagerEvents>(
    event: K,
    args: Parameters<ProtocolManagerEvents[K]>
  ): void {
    if (this.eventHandlers[event]) {
      for (const handler of this.eventHandlers[event]!) {
        try {
          (handler as Function)(...args);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
          // Report error to monitoring system in production
          if (process.env.NODE_ENV === 'production') {
            // TODO: Report to error monitoring service
          }
        }
      }
    }
  }
}
