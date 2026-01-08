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
 * Nostr Client Implementation
 * 
 * Provides a low-level client for connecting to Nostr relays
 * and handling events according to NIP specifications.
 */
import {
  getPublicKey,
  getEventHash,
  nip04,
  nip19,
  relayInit,
  type Event as NostrEvent,
  type UnsignedEvent,
  type Filter,
  type Relay
} from 'nostr-tools';
import { schnorr } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

export interface NostrClientConfig {
  privateKey?: string;
  relays?: string[];
}

export interface NostrProfile {
  name?: string;
  about?: string;
  picture?: string;
  nip05?: string;
}

export type NostrEventCallback = (event: NostrEvent) => void;

const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol',
  'wss://relay.snort.social'
];

export class NostrClient {
  private relayConnections: Map<string, Relay> = new Map();
  private privateKey: string | null = null;
  private publicKey: string | null = null;
  private relays: string[];
  private subscriptions: Map<string, { unsub: () => void }> = new Map();

  constructor(config?: NostrClientConfig) {
    this.relays = config?.relays || DEFAULT_RELAYS;
    
    if (config?.privateKey) {
      this.setPrivateKey(config.privateKey);
    }
  }

  /**
   * Set the private key for signing events
   */
  setPrivateKey(privateKey: string): void {
    // Handle nsec format
    if (privateKey.startsWith('nsec')) {
      const decoded = nip19.decode(privateKey);
      if (decoded.type === 'nsec') {
        this.privateKey = decoded.data as string;
      }
    } else {
      this.privateKey = privateKey;
    }
    
    if (this.privateKey) {
      this.publicKey = getPublicKey(this.privateKey);
    }
  }

  /**
   * Generate a new keypair
   */
  generateKeyPair(): { privateKey: string; publicKey: string } {
    const privateKeyBytes = crypto.getRandomValues(new Uint8Array(32));
    const privateKey = Array.from(privateKeyBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    this.setPrivateKey(privateKey);
    
    return {
      privateKey: privateKey,
      publicKey: this.publicKey!
    };
  }

  /**
   * Get the current public key
   */
  getPublicKey(): string | null {
    return this.publicKey;
  }

  /**
   * Connect to relays
   */
  async connect(): Promise<void> {
    const connectionPromises = this.relays.map(async (url) => {
      try {
        const relay = relayInit(url);
        await relay.connect();
        this.relayConnections.set(url, relay);
        console.log('Connected to relay:', url);
      } catch (error) {
        console.warn('Failed to connect to relay:', url, error);
      }
    });
    
    await Promise.allSettled(connectionPromises);
    console.log('NostrClient connected to', this.relayConnections.size, 'relays');
  }

  /**
   * Disconnect from all relays
   */
  disconnect(): void {
    // Close all subscriptions
    for (const [id, sub] of this.subscriptions) {
      sub.unsub();
    }
    this.subscriptions.clear();
    
    // Close all relay connections
    for (const [url, relay] of this.relayConnections) {
      relay.close();
    }
    this.relayConnections.clear();
    console.log('NostrClient disconnected');
  }

  /**
   * Publish an event to relays
   */
  async publish(event: NostrEvent): Promise<void> {
    console.log('[Nostr] Publishing event to', this.relayConnections.size, 'relays');
    
    const publishPromises = Array.from(this.relayConnections.entries()).map(async ([url, relay]) => {
      try {
        await relay.publish(event);
        console.log('[Nostr] ✅ Published to', url);
      } catch (error) {
        console.warn('[Nostr] ❌ Failed to publish to', url, error);
      }
    });
    
    await Promise.allSettled(publishPromises);
  }

  /**
   * Create and sign an event
   */
  async createEvent(kind: number, content: string, tags: string[][] = []): Promise<NostrEvent> {
    if (!this.privateKey || !this.publicKey) {
      throw new Error('No private key set');
    }

    const unsignedEvent: UnsignedEvent = {
      kind,
      pubkey: this.publicKey,
      created_at: Math.floor(Date.now() / 1000),
      tags,
      content
    };

    // Calculate event ID (SHA256 of serialized event)
    const serialized = JSON.stringify([
      0,
      unsignedEvent.pubkey,
      unsignedEvent.created_at,
      unsignedEvent.kind,
      unsignedEvent.tags,
      unsignedEvent.content
    ]);
    const id = bytesToHex(sha256(new TextEncoder().encode(serialized)));
    
    // Sign with Schnorr signature (convert hex strings to bytes)
    const sig = bytesToHex(schnorr.sign(hexToBytes(id), hexToBytes(this.privateKey)));

    console.log('[Nostr] Created event:', { kind, id: id.slice(0, 8) + '...' });

    return {
      ...unsignedEvent,
      id,
      sig
    };
  }

  /**
   * Subscribe to events matching filters
   */
  subscribe(
    filters: Filter[],
    onEvent: NostrEventCallback,
    onEose?: () => void
  ): string {
    const subId = crypto.randomUUID();
    const unsubs: (() => void)[] = [];
    const seenEvents = new Set<string>(); // Dedupe events from multiple relays
    
    const dedupeCallback: NostrEventCallback = (event) => {
      if (seenEvents.has(event.id)) return; // Skip duplicate
      seenEvents.add(event.id);
      onEvent(event);
    };
    
    for (const relay of this.relayConnections.values()) {
      const sub = relay.sub(filters);
      sub.on('event', dedupeCallback);
      if (onEose) sub.on('eose', onEose);
      unsubs.push(() => sub.unsub());
    }

    this.subscriptions.set(subId, {
      unsub: () => unsubs.forEach(fn => fn())
    });
    return subId;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subId: string): void {
    const sub = this.subscriptions.get(subId);
    if (sub) {
      sub.unsub();
      this.subscriptions.delete(subId);
    }
  }

  /**
   * Send a text note (kind 1)
   */
  async sendNote(content: string, replyTo?: string): Promise<NostrEvent> {
    const tags: string[][] = [];
    
    if (replyTo) {
      tags.push(['e', replyTo, '', 'reply']);
    }

    const event = await this.createEvent(1, content, tags);
    await this.publish(event);
    return event;
  }

  /**
   * Send an encrypted direct message (NIP-04)
   */
  async sendDirectMessage(recipientPubkey: string, content: string): Promise<NostrEvent> {
    if (!this.privateKey) {
      throw new Error('No private key set');
    }

    console.log('[Nostr] Sending DM to', recipientPubkey.slice(0, 8) + '...');
    
    try {
      const encryptedContent = await nip04.encrypt(this.privateKey, recipientPubkey, content);
      console.log('[Nostr] Message encrypted');
      
      const tags = [['p', recipientPubkey]];
      const event = await this.createEvent(4, encryptedContent, tags);
      await this.publish(event);
      
      console.log('[Nostr] ✅ DM sent successfully');
      return event;
    } catch (error) {
      console.error('[Nostr] ❌ Failed to send DM:', error);
      throw error;
    }
  }

  /**
   * Decrypt a direct message (NIP-04)
   */
  async decryptDirectMessage(event: NostrEvent): Promise<string> {
    if (!this.privateKey) {
      throw new Error('No private key set');
    }

    // For NIP-04, we need the OTHER party's pubkey to decrypt
    // If we sent the message, use the recipient's pubkey from 'p' tag
    // If someone else sent it, use their pubkey
    const isFromMe = event.pubkey === this.publicKey;
    let otherPubkey: string;
    
    if (isFromMe) {
      // We sent this - get recipient from 'p' tag
      const pTag = event.tags.find(t => t[0] === 'p');
      if (!pTag || !pTag[1]) {
        throw new Error('No recipient pubkey in message');
      }
      otherPubkey = pTag[1];
    } else {
      // Someone sent to us - use their pubkey
      otherPubkey = event.pubkey;
    }
    
    return await nip04.decrypt(this.privateKey, otherPubkey, event.content);
  }

  /**
   * Subscribe to direct messages
   */
  subscribeToDirectMessages(onMessage: (event: NostrEvent, decrypted: string) => void): string {
    if (!this.publicKey) {
      throw new Error('No public key set');
    }

    console.log('[Nostr] Subscribing to DMs for', this.publicKey.slice(0, 8) + '...');

    const filters: Filter[] = [
      { kinds: [4], '#p': [this.publicKey] }, // Messages to us
      { kinds: [4], authors: [this.publicKey] } // Messages from us
    ];

    return this.subscribe(filters, async (event) => {
      console.log('[Nostr] Received DM event:', event.id.slice(0, 8) + '...');
      try {
        const decrypted = await this.decryptDirectMessage(event);
        console.log('[Nostr] Decrypted message from', event.pubkey.slice(0, 8) + '...');
        onMessage(event, decrypted);
      } catch (error) {
        console.error('[Nostr] Failed to decrypt message:', error);
      }
    });
  }

  /**
   * Get user profile (kind 0)
   */
  async getProfile(pubkey: string): Promise<NostrProfile | null> {
    const events = await this.queryEvents([{ kinds: [0], authors: [pubkey], limit: 1 }]);

    if (events.length > 0) {
      try {
        return JSON.parse(events[0].content);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Set user profile (kind 0)
   */
  async setProfile(profile: NostrProfile): Promise<NostrEvent> {
    const content = JSON.stringify(profile);
    const event = await this.createEvent(0, content);
    await this.publish(event);
    return event;
  }

  /**
   * Get events by filter
   */
  async queryEvents(filters: Filter[]): Promise<NostrEvent[]> {
    const events: NostrEvent[] = [];
    const seen = new Set<string>();
    
    const queryPromises = Array.from(this.relayConnections.values()).map(relay => {
      return new Promise<void>((resolve) => {
        const sub = relay.sub(filters);
        
        sub.on('event', (event: NostrEvent) => {
          if (!seen.has(event.id)) {
            seen.add(event.id);
            events.push(event);
          }
        });
        
        sub.on('eose', () => {
          sub.unsub();
          resolve();
        });
        
        // Timeout after 3 seconds
        setTimeout(() => {
          sub.unsub();
          resolve();
        }, 3000);
      });
    });
    
    await Promise.allSettled(queryPromises);
    return events;
  }

  /**
   * Create a channel (NIP-28)
   */
  async createChannel(name: string, about?: string, picture?: string): Promise<NostrEvent> {
    const metadata = {
      name,
      about: about || '',
      picture: picture || ''
    };
    
    const event = await this.createEvent(40, JSON.stringify(metadata));
    await this.publish(event);
    return event;
  }

  /**
   * Send a message to a channel (NIP-28)
   */
  async sendChannelMessage(channelId: string, content: string, replyTo?: string): Promise<NostrEvent> {
    const tags: string[][] = [
      ['e', channelId, '', 'root']
    ];
    
    if (replyTo) {
      tags.push(['e', replyTo, '', 'reply']);
    }

    const event = await this.createEvent(42, content, tags);
    await this.publish(event);
    return event;
  }

  /**
   * Subscribe to channel messages
   */
  subscribeToChannel(channelId: string, onMessage: NostrEventCallback): string {
    const filters: Filter[] = [
      { kinds: [42], '#e': [channelId] }
    ];

    return this.subscribe(filters, onMessage);
  }
}

export default NostrClient;
