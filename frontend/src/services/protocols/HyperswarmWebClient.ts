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
 * Hyperswarm Web Client
 * 
 * Browser-side client that connects to a DHT relay server via WebSocket
 * to participate in the Hyperswarm network without native socket access.
 * 
 * This provides true P2P functionality in web browsers via DHT relay.
 */

import { EventEmitter } from 'events';

/**
 * Connection state for the Hyperswarm client
 */
export enum HyperswarmConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

/**
 * Peer information from the DHT
 */
export interface HyperswarmPeer {
  publicKey: string;
  host?: string;
  port?: number;
  isLocal: boolean;
}

/**
 * Topic/swarm information
 */
export interface HyperswarmTopic {
  id: string;
  topicHex: string;
  peers: HyperswarmPeer[];
  isServer: boolean;
  isClient: boolean;
}

/**
 * Configuration for the Hyperswarm web client
 */
export interface HyperswarmWebConfig {
  relayUrl: string;
  autoReconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

/**
 * Events emitted by the Hyperswarm web client
 */
export interface HyperswarmWebEvents {
  'connection': (peer: HyperswarmPeer, topic: string) => void;
  'disconnection': (peer: HyperswarmPeer, topic: string) => void;
  'data': (data: ArrayBuffer | string, peer: HyperswarmPeer) => void;
  'error': (error: Error) => void;
  'stateChange': (state: HyperswarmConnectionState) => void;
  'topicJoined': (topic: HyperswarmTopic) => void;
  'topicLeft': (topicHex: string) => void;
  'peerDiscovered': (peer: HyperswarmPeer, topic: string) => void;
}

/**
 * Hyperswarm Web Client
 * 
 * Connects to a DHT relay server to enable P2P communication in browsers.
 */
export class HyperswarmWebClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: HyperswarmWebConfig;
  private state: HyperswarmConnectionState = HyperswarmConnectionState.DISCONNECTED;
  private reconnectAttempts = 0;
  private topics: Map<string, HyperswarmTopic> = new Map();
  private serverPublicKey: string | null = null;
  private messageQueue: any[] = [];

  constructor(config: HyperswarmWebConfig) {
    super();
    this.config = {
      autoReconnect: true,
      reconnectDelay: 2000,
      maxReconnectAttempts: 10,
      ...config
    };
  }

  /**
   * Connects to the DHT relay server
   */
  async connect(): Promise<void> {
    if (this.state === HyperswarmConnectionState.CONNECTED) {
      return;
    }

    this.setState(HyperswarmConnectionState.CONNECTING);

    return new Promise((resolve, reject) => {
      try {
        console.log('[Hyperswarm] 🔌 Connecting to relay:', this.config.relayUrl);
        this.ws = new WebSocket(this.config.relayUrl);

        this.ws.onopen = () => {
          console.log('[Hyperswarm] ✅ Connected to relay');
          this.setState(HyperswarmConnectionState.CONNECTED);
          this.reconnectAttempts = 0;
          this.flushMessageQueue();
          resolve();
        };

        this.ws.onclose = (event) => {
          console.log('[Hyperswarm] 🔌 Disconnected from relay', event.code, event.reason);
          this.setState(HyperswarmConnectionState.DISCONNECTED);
          this.handleDisconnect();
        };

        this.ws.onerror = (error) => {
          console.error('[Hyperswarm] ❌ WebSocket error:', error);
          this.emit('error', new Error('WebSocket connection failed'));
          reject(error);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

      } catch (error) {
        this.setState(HyperswarmConnectionState.ERROR);
        reject(error);
      }
    });
  }

  /**
   * Disconnects from the DHT relay server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setState(HyperswarmConnectionState.DISCONNECTED);
  }

  /**
   * Joins a topic/swarm
   * @param topicHex The topic as a hex string (32 bytes / 64 hex chars)
   * @param options Join options
   */
  async join(topicHex: string, options: { server?: boolean; client?: boolean } = {}): Promise<HyperswarmTopic> {
    const { server = true, client = true } = options;

    console.log('[Hyperswarm] 📢 Joining topic:', topicHex.substring(0, 16) + '...');

    this.sendMessage({
      type: 'join',
      topic: topicHex,
      server,
      client
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Join timeout'));
      }, 10000);

      const handler = (topic: HyperswarmTopic) => {
        if (topic.topicHex === topicHex) {
          clearTimeout(timeout);
          this.off('topicJoined', handler);
          resolve(topic);
        }
      };

      this.on('topicJoined', handler);
    });
  }

  /**
   * Leaves a topic/swarm
   * @param topicHex The topic as a hex string
   */
  async leave(topicHex: string): Promise<void> {
    console.log('[Hyperswarm] 👋 Leaving topic:', topicHex.substring(0, 16) + '...');

    this.sendMessage({
      type: 'leave',
      topic: topicHex
    });

    this.topics.delete(topicHex);
    this.emit('topicLeft', topicHex);
  }

  /**
   * Looks up peers for a topic
   * @param topicHex The topic as a hex string
   */
  async lookup(topicHex: string): Promise<HyperswarmPeer[]> {
    console.log('[Hyperswarm] 🔍 Looking up peers for:', topicHex.substring(0, 16) + '...');

    this.sendMessage({
      type: 'lookup',
      topic: topicHex
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Lookup timeout'));
      }, 10000);

      const handler = (message: any) => {
        if (message.type === 'lookup_result' && message.topic === topicHex) {
          clearTimeout(timeout);
          resolve(message.peers || []);
        }
      };

      // One-time listener for lookup result
      const originalHandler = this.handleMessage.bind(this);
      this.handleMessage = (data: string) => {
        originalHandler(data);
        try {
          const msg = JSON.parse(data);
          handler(msg);
        } catch {}
      };
    });
  }

  /**
   * Sends data to a peer
   * @param publicKey The peer's public key
   * @param data The data to send
   */
  sendToPeer(publicKey: string, data: ArrayBuffer | string): void {
    this.sendMessage({
      type: 'data',
      targetPeer: publicKey,
      data: typeof data === 'string' ? data : Array.from(new Uint8Array(data))
    });
  }

  /**
   * Broadcasts data to all peers in a topic
   * @param topicHex The topic hex string
   * @param data The data to broadcast
   */
  broadcast(topicHex: string, data: ArrayBuffer | string): void {
    this.sendMessage({
      type: 'broadcast',
      topic: topicHex,
      data: typeof data === 'string' ? data : Array.from(new Uint8Array(data))
    });
  }

  /**
   * Gets the current connection state
   */
  getState(): HyperswarmConnectionState {
    return this.state;
  }

  /**
   * Gets the server's public key
   */
  getServerPublicKey(): string | null {
    return this.serverPublicKey;
  }

  /**
   * Gets all joined topics
   */
  getTopics(): HyperswarmTopic[] {
    return Array.from(this.topics.values());
  }

  /**
   * Generates a topic hash from a string (simple hash for demo)
   * In production, use proper crypto hashing
   */
  static async hashTopic(name: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(name);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Private methods

  private setState(state: HyperswarmConnectionState): void {
    if (this.state !== state) {
      this.state = state;
      this.emit('stateChange', state);
    }
  }

  private sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for when connected
      this.messageQueue.push(message);
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.sendMessage(message);
    }
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'welcome':
          this.serverPublicKey = message.publicKey;
          console.log('[Hyperswarm] 🤝 Server public key:', message.publicKey?.substring(0, 16) + '...');
          break;

        case 'joined':
          const topic: HyperswarmTopic = {
            id: message.topic,
            topicHex: message.topic,
            peers: [],
            isServer: true,
            isClient: true
          };
          this.topics.set(message.topic, topic);
          this.emit('topicJoined', topic);
          console.log('[Hyperswarm] ✅ Joined topic:', message.topic?.substring(0, 16) + '...');
          break;

        case 'left':
          this.topics.delete(message.topic);
          this.emit('topicLeft', message.topic);
          break;

        case 'peer_discovered':
          const discoveredPeer: HyperswarmPeer = {
            publicKey: message.publicKey,
            host: message.host,
            port: message.port,
            isLocal: false
          };
          this.emit('peerDiscovered', discoveredPeer, message.topic);
          console.log('[Hyperswarm] 👤 Peer discovered:', message.publicKey?.substring(0, 16) + '...');
          break;

        case 'connection':
          const connectedPeer: HyperswarmPeer = {
            publicKey: message.publicKey,
            isLocal: false
          };
          this.emit('connection', connectedPeer, message.topic);
          break;

        case 'disconnection':
          const disconnectedPeer: HyperswarmPeer = {
            publicKey: message.publicKey,
            isLocal: false
          };
          this.emit('disconnection', disconnectedPeer, message.topic);
          break;

        case 'data':
          const dataPeer: HyperswarmPeer = {
            publicKey: message.fromPeer,
            isLocal: false
          };
          this.emit('data', message.data, dataPeer);
          break;

        case 'error':
          console.error('[Hyperswarm] ❌ Relay error:', message.error);
          this.emit('error', new Error(message.error));
          break;

        default:
          console.log('[Hyperswarm] Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('[Hyperswarm] Error parsing message:', error);
    }
  }

  private handleDisconnect(): void {
    if (
      this.config.autoReconnect &&
      this.reconnectAttempts < (this.config.maxReconnectAttempts || 10)
    ) {
      this.reconnectAttempts++;
      console.log(`[Hyperswarm] 🔄 Reconnecting (attempt ${this.reconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect().catch(err => {
          console.error('[Hyperswarm] Reconnection failed:', err);
        });
      }, this.config.reconnectDelay || 2000);
    }
  }
}

export default HyperswarmWebClient;
