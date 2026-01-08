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
 * Communication Context Provider
 * 
 * Manages secure peer-to-peer communication across multiple protocols (Hypernat, WebRTC) and provides
 * a unified interface for all communication-related operations throughout the application.
 * 
 * @module CommunicationContext
 * 
 * @security
 * - End-to-end encryption for all data transmission
 * - Zero-trust architecture principles
 * - Secure protocol negotiation
 * - Cryptographic identity verification
 * - No centralized message storage
 * 
 * @performance
 * - Lazy initialization of protocol handlers
 * - Efficient state updates with batched rendering
 * - Connection pooling for optimal resource usage
 * - Fallback mechanisms for network resilience
 * 
 * @accessibility
 * - Connection state announcements for screen readers
 * - Clear status indicators for connection state
 * 
 * @maintainability
 * - Protocol abstraction layer for vendor independence
 * - Extensive error handling and logging
 * - Clear separation of concerns between protocols and business logic
 */
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import useDeviceManager from '../hooks/useDeviceManager';
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
  ProtocolConfig
} from '../types/core';
import { ProtocolManager } from '../services/ProtocolManager';

/**
 * Communication Context State Interface
 * 
 * Defines the complete communication system state and available operations.
 * This interface is implemented by the CommunicationProvider and consumed by
 * components via the useCommunication hook.
 * 
 * @interface CommunicationContextState
 */
interface CommunicationContextState {
  /** The underlying protocol manager instance that handles protocol-specific operations */
  protocolManager: ProtocolManager;
  /** Whether the communication system has been initialized */
  isInitialized: boolean;
  /** Whether the communication system is currently connected */
  isConnected: boolean;
  /** The currently active communication protocol (WebRTC, Hypernat, etc.) */
  activeProtocol: CommunicationProtocol | null;
  /** Current connection status (CONNECTING, CONNECTED, DISCONNECTED, ERROR) */
  connectionStatus: ConnectionStatus;
  /** Current user's peer object with identity information */
  currentPeer: Peer | null;
  /** List of available peers on the current network */
  peers: Peer[];
  /** List of rooms the current peer has joined */
  rooms: Room[];
  /** Current room participants mapped by roomId and then peerId */
  participants: Record<RoomId, Record<PeerId, Peer>>;
  /** Media streams for active participants mapped by peerId */
  streams: Record<PeerId, MediaStream>;
  /** Media connection status for each participant */
  mediaConnectionStatus: Record<PeerId, ConnectionStatus>;
  /** Local media stream (triggers re-render when stream starts/stops) */
  localStream: MediaStream | null;

  // Device Management
  audioInputs: MediaDeviceInfo[];
  videoInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
  selectedAudioInput: MediaDeviceInfo | null;
  selectedVideoInput: MediaDeviceInfo | null;
  selectedAudioOutput: MediaDeviceInfo | null;
  selectAudioInput: (device: MediaDeviceInfo) => void;
  selectVideoInput: (device: MediaDeviceInfo) => void;
  selectAudioOutput: (device: MediaDeviceInfo) => void;
  
  // Communication Actions
  
  /**
   * Initializes all communication protocols with the provided configurations
   * 
   * @param {ProtocolConfig[]} configs - Configuration objects for each protocol
   * @returns {Promise<void>} A promise that resolves when initialization is complete
   * @throws {Error} If initialization fails for any protocol
   * 
   * @security Protocols are initialized with secure defaults, including enabled encryption
   */
  initialize: (configs: ProtocolConfig[]) => Promise<void>;
  
  /**
   * Establishes connection using the active protocol
   * 
   * @returns {Promise<void>} A promise that resolves when connection is established
   * @throws {Error} If connection fails
   * 
   * @performance Connection timeout is configured based on network conditions
   */
  connect: () => Promise<void>;
  
  /**
   * Disconnects from the current active protocol, closing all connections
   * 
   * @returns {Promise<void>} A promise that resolves when disconnection is complete
   * @throws {Error} If disconnection encounters an error
   * 
   * @security Ensures proper shutdown of secure channels
   */
  disconnect: () => Promise<void>;
  
  /**
   * Changes the active communication protocol
   * 
   * @param {CommunicationProtocol} protocol - The protocol to activate
   * 
   * @security Protocol change includes re-verification of secure channels
   */
  setActiveProtocol: (protocol: CommunicationProtocol) => void;
  
  /**
   * Creates a new secure room for communication
   * 
   * @param {Record<string, unknown>} [options] - Optional configuration parameters
   * @returns {Promise<Room>} A promise resolving to the created room
   * @throws {Error} If room creation fails
   * 
   * @security Rooms are always created with encryption enabled
   */
  createRoom: (options?: Record<string, unknown>) => Promise<Room>;
  
  /**
   * Joins an existing room on the network
   * 
   * @param {RoomId} roomId - Identifier for the room to join
   * @param {CommunicationProtocol} [protocol] - Optional protocol override
   * @returns {Promise<Room>} A promise resolving to the joined room
   * @throws {Error} If joining fails or room doesn't exist
   * 
   * @security Room joining includes cryptographic verification
   */
  joinRoom: (roomId: RoomId, protocol?: CommunicationProtocol) => Promise<Room>;
  
  /**
   * Leaves a currently joined room
   * 
   * @param {RoomId} roomId - Identifier for the room to leave
   * @returns {Promise<void>} A promise that resolves when the room is left
   * @throws {Error} If leaving fails
   * 
   * @security Ensures proper cleanup of secure room state
   */
  leaveRoom: (roomId: RoomId) => Promise<void>;
  
  /**
   * Ends meeting for all participants (host only)
   * Broadcasts meeting_ended event to all peers before leaving
   */
  endMeeting: (roomId: RoomId, reason?: string) => Promise<void>;
  
  /**
   * Sends a message to a specific room
   * 
   * @param {RoomId} roomId - Target room identifier
   * @param {string} content - Message content
   * @param {'text' | 'image' | 'file' | 'system'} [contentType='text'] - Type of content
   * @param {MessageId} [replyToId] - Optional reference to message being replied to
   * @returns {Promise<Message>} A promise resolving to the sent message
   * @throws {Error} If message sending fails
   * 
   * @security Messages are encrypted end-to-end
   */
  sendMessage: (roomId: RoomId, content: string, contentType?: 'text' | 'image' | 'file' | 'system', replyToId?: MessageId) => Promise<Message>;
  
  /**
   * Sends a file to a specific room
   * 
   * @param {RoomId} roomId - Target room identifier
   * @param {File} file - File to send
   * @returns {Promise<FileId>} A promise resolving to the file identifier
   * @throws {Error} If file transmission fails
   * 
   * @security Files are encrypted before transmission
   * @performance Files are chunked for efficient transfer
   */
  sendFile: (roomId: RoomId, file: File) => Promise<FileId>;
  
  /**
   * Retrieves metadata for all available files in a room
   * 
   * @param {RoomId} roomId - Target room identifier
   * @returns {FileMetadata[]} Array of file metadata objects
   * 
   * @security Only returns metadata, not file contents
   */
  getAvailableFiles: (roomId: RoomId) => FileMetadata[];
  
  /**
   * Downloads a file by its identifier
   * 
   * @param {FileId} fileId - Identifier for the file to download
   * @returns {Promise<Blob>} A promise resolving to the file content
   * @throws {Error} If download fails
   * 
   * @security Downloads through secure channels only
   * @performance Progressive download with progress reporting
   */
  downloadFile: (fileId: FileId) => Promise<Blob>;
  
  /**
   * Starts local media stream for audio/video communication
   * 
   * @returns {Promise<MediaStream>} A promise resolving to the media stream
   * @throws {Error} If media capture fails or permissions not granted
   * 
   * @security Requires explicit user permission
   */
  startLocalStream: (audioDeviceId?: string, videoDeviceId?: string) => Promise<MediaStream>;
  
  /**
   * Stops the local media stream
   * 
   * @security Ensures complete termination of media capture
   */
  stopLocalStream: () => void;
  
  /**
   * Gets the current local media stream if active
   * 
   * @returns {MediaStream | null} The current media stream or null if not active
   */
  getLocalStream: () => MediaStream | null;
  
  /**
   * Mute/unmute a participant (host control)
   * 
   * @param {PeerId} peerId - The participant to mute/unmute
   * @param {boolean} muted - Whether to mute or unmute
   */
  muteParticipant: (peerId: PeerId, muted: boolean) => void;
  
  /**
   * Kick a participant from the room (host control)
   * 
   * @param {PeerId} peerId - The participant to kick
   */
  kickParticipant: (peerId: PeerId) => void;
}

// Create context with default values
const CommunicationContext = createContext<CommunicationContextState | null>(null);

/**
 * Props for the CommunicationProvider component
 * 
 * @interface CommunicationProviderProps
 */
interface CommunicationProviderProps {
  /** Child components that will have access to the communication context */
  children: ReactNode;
  /** Optional initial protocol configurations to initialize on mount */
  initialConfigs?: ProtocolConfig[];
}

/**
 * Communication Provider Component
 * 
 * Provides the communication context to all child components and manages the
 * lifecycle of the communication system.
 * 
 * @component
 * @example
 * ```tsx
 * <CommunicationProvider initialConfigs={[
 *   { protocol: CommunicationProtocol.HYPERNAT, enabled: true, config: { ... } }
 * ]}>
 *   <App />
 * </CommunicationProvider>
 * ```
 */
export const CommunicationProvider: React.FC<CommunicationProviderProps> = ({ 
  children,
  initialConfigs = []
}) => {
  // Create singleton instance of ProtocolManager
  const [protocolManager] = useState(() => new ProtocolManager());
  
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [activeProtocol, setActiveProtocol] = useState<CommunicationProtocol | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [currentPeer, setCurrentPeer] = useState<Peer | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [participants, setParticipants] = useState<Record<RoomId, Record<PeerId, Peer>>>({});
  const [streams, setStreams] = useState<Record<PeerId, MediaStream>>({});
  const [mediaConnectionStatus, setMediaConnectionStatus] = useState<Record<PeerId, ConnectionStatus>>({});
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const { 
    audioInputs, 
    videoInputs, 
    audioOutputs, 
    selectedAudioInput, 
    selectedVideoInput, 
    selectedAudioOutput,
    selectAudioInput,
    selectVideoInput,
    selectAudioOutput
  } = useDeviceManager();

  /**
 * Initializes the communication system with the provided protocol configurations
 * 
 * @param {ProtocolConfig[]} configs - Array of protocol configurations
 * @returns {Promise<void>} A promise that resolves when initialization completes
 * @throws {Error} If initialization fails
 * 
 * @security
 * - Only initializes protocols with secure configurations
 * - Validates protocol configurations before initialization
 */
  const initialize = async (configs: ProtocolConfig[]): Promise<void> => {
    try {
      await protocolManager.initializeAllProtocols(configs);
      setIsInitialized(true);
      
      const active = protocolManager.getActiveProtocol();
      if (active) {
        setActiveProtocol(active);
      }
      
      updateState();
    } catch (error) {
      console.error('Failed to initialize communication system:', error);
      throw error;
    }
  };

  /**
 * Establishes connection using the active communication protocol
 * 
 * @returns {Promise<void>} A promise that resolves when connection is established
 * @throws {Error} If connection fails
 * 
 * @security
 * - Connects using secure channels only
 * - Validates connection parameters
 * - Performs protocol security checks
 */
  const connect = async (): Promise<void> => {
    try {
      await protocolManager.connect();
      updateState();
    } catch (error) {
      console.error('Failed to connect:', error);
      throw error;
    }
  };

  /**
 * Disconnects from the currently active protocol
 * 
 * @returns {Promise<void>} A promise that resolves when disconnection completes
 * @throws {Error} If disconnection encounters an error
 * 
 * @security
 * - Ensures proper closure of secure channels
 * - Clears sensitive connection state
 */
  const disconnect = async (): Promise<void> => {
    try {
      await protocolManager.disconnect();
      updateState();
    } catch (error) {
      console.error('Failed to disconnect:', error);
      throw error;
    }
  };

  /**
 * Updates the context state from the protocol manager
 * Synchronizes the React state with the underlying protocol manager state
 * 
 * @private
 */
  const updateState = () => {
    setConnectionStatus(protocolManager.getConnectionStatus());
    setCurrentPeer(protocolManager.getCurrentPeer());
    setPeers(protocolManager.getPeers());
    setRooms(protocolManager.getRooms());
    setActiveProtocol(protocolManager.getActiveProtocol());
    setIsConnected(protocolManager.getConnectionStatus() === ConnectionStatus.CONNECTED);
    // Update participants, streams and media connection status
    if (protocolManager.getParticipants) {
      setParticipants(protocolManager.getParticipants());
    }
    if (protocolManager.getStreams) {
      setStreams(protocolManager.getStreams());
    }
    if (protocolManager.getMediaConnectionStatus) {
      setMediaConnectionStatus(protocolManager.getMediaConnectionStatus());
    }
  };

  // Setup event listeners
  useEffect(() => {
    const events: Array<keyof Required<ProtocolManager['eventHandlers']>> = [
      'onPeerConnect',
      'onPeerDisconnect',
      'onPeerStatusChange',
      'onRoomJoined',
      'onRoomLeft',
      'onProtocolStatusChange',
      'onActiveProtocolChange'
    ];

    // Register event handlers
    events.forEach(event => {
      protocolManager.on(event as any, updateState);
    });

    // Run initialization if initial configs provided
    if (initialConfigs.length > 0 && !isInitialized) {
      initialize(initialConfigs).catch(console.error);
    }

    // Clean up event listeners
    return () => {
      events.forEach(event => {
        protocolManager.off(event as any, updateState);
      });
    };
  }, []);

  // Context value
  const contextValue: CommunicationContextState = {
    protocolManager,
    isInitialized,
    isConnected,
    activeProtocol,
    connectionStatus,
    currentPeer,
    peers,
    participants,
    streams,
    mediaConnectionStatus,
    localStream,
    rooms,

    // Device Management
    audioInputs,
    videoInputs,
    audioOutputs,
    selectedAudioInput,
    selectedVideoInput,
    selectedAudioOutput,
    selectAudioInput,
    selectVideoInput,
    selectAudioOutput,
    
    // Actions
    initialize,
    connect,
    disconnect,
    setActiveProtocol: (protocol: CommunicationProtocol) => {
      protocolManager.setActiveProtocol(protocol);
      updateState();
    },
    createRoom: async (options?: Record<string, unknown>) => {
      const room = await protocolManager.createRoom(options);
      updateState();
      return room;
    },
    joinRoom: async (roomId: RoomId, protocol?: CommunicationProtocol) => {
      const room = await protocolManager.joinRoom(roomId, protocol);
      updateState();
      return room;
    },
    leaveRoom: async (roomId: RoomId) => {
      await protocolManager.leaveRoom(roomId);
      updateState();
    },
    endMeeting: async (roomId: RoomId, reason?: string) => {
      // Broadcast meeting ended to all peers before leaving
      const adapter = protocolManager.getActiveAdapter();
      if (adapter && 'broadcastMeetingEnded' in adapter) {
        (adapter as any).broadcastMeetingEnded(reason || 'Host ended the meeting');
      }
      // Small delay to ensure message is sent
      await new Promise(resolve => setTimeout(resolve, 100));
      await protocolManager.leaveRoom(roomId);
      updateState();
    },
    sendMessage: (roomId: RoomId, content: string, contentType?: 'text' | 'image' | 'file' | 'system', replyToId?: MessageId) => {
      return protocolManager.sendMessage(roomId, content, contentType, replyToId);
    },
    sendFile: (roomId: RoomId, file: File) => {
      return protocolManager.sendFile(roomId, file);
    },
    getAvailableFiles: (roomId: RoomId) => {
      return protocolManager.getAvailableFiles(roomId);
    },
    downloadFile: (fileId: FileId) => {
      return protocolManager.downloadFile(fileId);
    },
    startLocalStream: async (audioDeviceId?: string, videoDeviceId?: string) => {
      const stream = await protocolManager.startLocalStream(
        audioDeviceId || selectedAudioInput?.deviceId,
        videoDeviceId || selectedVideoInput?.deviceId
      );
      setLocalStream(stream);
      return stream;
    },
    stopLocalStream: () => {
      protocolManager.stopLocalStream();
      setLocalStream(null);
    },
    getLocalStream: () => {
      return protocolManager.getLocalStream();
    },
    muteParticipant: (peerId: PeerId, muted: boolean) => {
      protocolManager.muteParticipant(peerId, muted);
      updateState();
    },
    kickParticipant: (peerId: PeerId) => {
      protocolManager.kickParticipant(peerId);
      updateState();
    }
  };

  return (
    <CommunicationContext.Provider value={contextValue}>
      {children}
    </CommunicationContext.Provider>
  );
};

/**
 * Custom hook for consuming the communication context
 * 
 * Provides access to all communication functionality and state throughout the application.
 * Must be used within a component that is a child of CommunicationProvider.
 * 
 * @hook
 * @returns {CommunicationContextState} The communication context state and actions
 * @throws {Error} If used outside of a CommunicationProvider
 * 
 * @example
 * ```tsx
 * function MessageSender() {
 *   const { sendMessage, activeProtocol } = useCommunication();
 *   
 *   const handleSend = () => {
 *     sendMessage(roomId, 'Hello world');
 *   };
 *   
 *   return (
 *     <div>
 *       <p>Current protocol: {activeProtocol}</p>
 *       <button onClick={handleSend}>Send Message</button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useCommunication = (): CommunicationContextState => {
  const context = useContext(CommunicationContext);
  if (!context) {
    throw new Error('useCommunication must be used within a CommunicationProvider');
  }
  return context;
};
