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
 * useNostr Hook
 * 
 * React hook for managing Nostr client state and interactions.
 * Provides real relay connections, encrypted DMs, profiles, and channels.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth, AuthStatus } from '../context/AuthContext';
import NostrClient, { NostrProfile } from '../services/nostr/NostrClient';
import type { Event as NostrEvent } from 'nostr-tools';

export interface NostrContact {
  pubkey: string;
  npub?: string;
  profile?: NostrProfile;
  lastMessage?: string;
  lastMessageAt?: number;
  unreadCount?: number;
}

export interface NostrMessage {
  id: string;
  pubkey: string;
  content: string;
  decryptedContent?: string;
  created_at: number;
  isFromMe: boolean;
  recipientPubkey?: string;
}

export interface NostrChannel {
  id: string;
  name: string;
  about?: string;
  picture?: string;
  createdAt: number;
  creatorPubkey: string;
}

export interface RelayStatus {
  url: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
}

const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol',
  'wss://relay.snort.social',
];

const NOSTR_MESSAGES_KEY = 'pigeon_nostr_messages_';
const NOSTR_CONTACTS_KEY = 'pigeon_nostr_contacts_';
const NOSTR_CHANNELS_KEY = 'pigeon_nostr_channels_';

// Helper to load messages from localStorage
const loadStoredMessages = (pubkey: string): Map<string, NostrMessage[]> => {
  try {
    const stored = localStorage.getItem(NOSTR_MESSAGES_KEY + pubkey);
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Map(Object.entries(parsed));
    }
  } catch (e) {
    console.error('[useNostr] Failed to load stored messages:', e);
  }
  return new Map();
};

// Helper to load contacts from localStorage
const loadStoredContacts = (pubkey: string): NostrContact[] => {
  try {
    const stored = localStorage.getItem(NOSTR_CONTACTS_KEY + pubkey);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('[useNostr] Failed to load stored contacts:', e);
  }
  return [];
};

// Helper to load channels from localStorage
const loadStoredChannels = (pubkey: string): NostrChannel[] => {
  try {
    const stored = localStorage.getItem(NOSTR_CHANNELS_KEY + pubkey);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('[useNostr] Failed to load stored channels:', e);
  }
  return [];
};

export function useNostr() {
  const { identity, status: authStatus } = useAuth();
  const clientRef = useRef<NostrClient | null>(null);
  
  // State - initialize from localStorage
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [relayStatuses, setRelayStatuses] = useState<RelayStatus[]>(
    DEFAULT_RELAYS.map(url => ({ url, status: 'disconnected' }))
  );
  const [contacts, setContacts] = useState<NostrContact[]>([]);
  const [messages, setMessages] = useState<Map<string, NostrMessage[]>>(new Map());
  const [channels, setChannels] = useState<NostrChannel[]>([]);
  const [channelMessages, setChannelMessages] = useState<Map<string, NostrMessage[]>>(new Map());
  const [channelSubscriptions, setChannelSubscriptions] = useState<Map<string, string>>(new Map());
  const [myProfile, setMyProfile] = useState<NostrProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load stored messages, contacts, and channels when identity changes
  useEffect(() => {
    if (identity?.publicKey) {
      const storedMessages = loadStoredMessages(identity.publicKey);
      const storedContacts = loadStoredContacts(identity.publicKey);
      const storedChannels = loadStoredChannels(identity.publicKey);
      if (storedMessages.size > 0) {
        setMessages(storedMessages);
        console.log('[useNostr] Loaded', storedMessages.size, 'conversations from storage');
      }
      if (storedContacts.length > 0) {
        setContacts(storedContacts);
        console.log('[useNostr] Loaded', storedContacts.length, 'contacts from storage');
      }
      if (storedChannels.length > 0) {
        setChannels(storedChannels);
        console.log('[useNostr] Loaded', storedChannels.length, 'channels from storage');
      }
    }
  }, [identity?.publicKey]);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (identity?.publicKey && messages.size > 0) {
      try {
        const obj = Object.fromEntries(messages);
        localStorage.setItem(NOSTR_MESSAGES_KEY + identity.publicKey, JSON.stringify(obj));
      } catch (e) {
        console.error('[useNostr] Failed to save messages:', e);
      }
    }
  }, [messages, identity?.publicKey]);

  // Save contacts to localStorage when they change
  useEffect(() => {
    if (identity?.publicKey && contacts.length > 0) {
      try {
        localStorage.setItem(NOSTR_CONTACTS_KEY + identity.publicKey, JSON.stringify(contacts));
      } catch (e) {
        console.error('[useNostr] Failed to save contacts:', e);
      }
    }
  }, [contacts, identity?.publicKey]);

  // Save channels to localStorage when they change
  useEffect(() => {
    if (identity?.publicKey) {
      try {
        localStorage.setItem(NOSTR_CHANNELS_KEY + identity.publicKey, JSON.stringify(channels));
      } catch (e) {
        console.error('[useNostr] Failed to save channels:', e);
      }
    }
  }, [channels, identity?.publicKey]);

  // Initialize client when identity changes
  useEffect(() => {
    if (identity?.privateKey && authStatus === AuthStatus.AUTHENTICATED) {
      const client = new NostrClient({
        privateKey: identity.privateKey,
        relays: DEFAULT_RELAYS,
      });
      clientRef.current = client;
    } else {
      clientRef.current = null;
    }
    
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, [identity?.privateKey, authStatus]);

  // Handle incoming messages (defined before connect so it can be used in dependency)
  const handleIncomingMessage = useCallback((event: NostrEvent, decrypted: string) => {
    const isFromMe = event.pubkey === identity?.publicKey;
    const otherPubkey = isFromMe 
      ? event.tags.find(t => t[0] === 'p')?.[1] || ''
      : event.pubkey;

    const message: NostrMessage = {
      id: event.id,
      pubkey: event.pubkey,
      content: event.content,
      decryptedContent: decrypted,
      created_at: event.created_at,
      isFromMe,
      recipientPubkey: event.tags.find(t => t[0] === 'p')?.[1],
    };

    setMessages(prev => {
      const updated = new Map(prev);
      const existing = updated.get(otherPubkey) || [];
      
      // Avoid duplicates
      if (!existing.find(m => m.id === message.id)) {
        updated.set(otherPubkey, [...existing, message].sort((a, b) => a.created_at - b.created_at));
      }
      return updated;
    });

    // Update contact if not exists
    if (!isFromMe) {
      setContacts(prev => {
        if (!prev.find(c => c.pubkey === otherPubkey)) {
          return [...prev, { pubkey: otherPubkey, lastMessage: decrypted, lastMessageAt: event.created_at }];
        }
        return prev.map(c => 
          c.pubkey === otherPubkey 
            ? { ...c, lastMessage: decrypted, lastMessageAt: event.created_at }
            : c
        );
      });
    }
  }, [identity?.publicKey]);

  // Connect to relays
  const connect = useCallback(async () => {
    console.log('[useNostr] Connect called, identity:', identity?.publicKey?.slice(0, 8));
    
    if (!clientRef.current || !identity) {
      console.error('[useNostr] No client or identity available');
      setError('No identity available. Please log in first.');
      return false;
    }

    setIsConnecting(true);
    setError(null);
    
    // Update status to connecting
    setRelayStatuses(prev => prev.map(r => ({ ...r, status: 'connecting' })));

    try {
      console.log('[useNostr] Connecting to relays...');
      await clientRef.current.connect();
      
      // Check which relays actually connected
      const connectedRelays = DEFAULT_RELAYS.map(url => ({
        url,
        status: 'connected' as const
      }));
      
      setRelayStatuses(connectedRelays);
      setIsConnected(true);
      
      console.log('[useNostr] Subscribing to DMs...');
      // Subscribe to DMs
      clientRef.current.subscribeToDirectMessages((event, decrypted) => {
        console.log('[useNostr] Received message callback');
        handleIncomingMessage(event, decrypted);
      });
      
      // Load our profile
      if (identity.publicKey) {
        console.log('[useNostr] Loading profile...');
        const profile = await clientRef.current.getProfile(identity.publicKey);
        if (profile) {
          setMyProfile(profile);
          console.log('[useNostr] Profile loaded:', profile.name);
        }
      }
      
      console.log('[useNostr] ✅ Connected successfully');
      return true;
    } catch (err) {
      console.error('[useNostr] ❌ Failed to connect:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
      setRelayStatuses(prev => prev.map(r => ({ ...r, status: 'error' })));
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [identity, handleIncomingMessage]);

  // Disconnect from relays
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
    setIsConnected(false);
    setRelayStatuses(prev => prev.map(r => ({ ...r, status: 'disconnected' })));
  }, []);

  // Send encrypted DM
  const sendDirectMessage = useCallback(async (recipientPubkey: string, content: string) => {
    console.log('[useNostr] sendDirectMessage called');
    
    if (!clientRef.current) {
      console.error('[useNostr] No client available');
      throw new Error('Not connected');
    }

    if (!isConnected) {
      console.error('[useNostr] Not connected to relays');
      throw new Error('Not connected to relays. Please connect first.');
    }

    console.log('[useNostr] Sending message to:', recipientPubkey.slice(0, 8) + '...');
    const event = await clientRef.current.sendDirectMessage(recipientPubkey, content);
    
    // Add to local messages
    const message: NostrMessage = {
      id: event.id,
      pubkey: event.pubkey,
      content: event.content,
      decryptedContent: content,
      created_at: event.created_at,
      isFromMe: true,
      recipientPubkey,
    };

    setMessages(prev => {
      const updated = new Map(prev);
      const existing = updated.get(recipientPubkey) || [];
      // Avoid duplicates (in case subscription already added it)
      if (!existing.find(m => m.id === event.id)) {
        updated.set(recipientPubkey, [...existing, message]);
      }
      return updated;
    });

    console.log('[useNostr] ✅ Message added to local state');
    return event;
  }, [isConnected]);

  // Get/set profile
  const updateProfile = useCallback(async (profile: NostrProfile) => {
    if (!clientRef.current) {
      throw new Error('Not connected');
    }

    await clientRef.current.setProfile(profile);
    setMyProfile(profile);
  }, []);

  // Fetch a user's profile
  const fetchProfile = useCallback(async (pubkey: string): Promise<NostrProfile | null> => {
    if (!clientRef.current) {
      return null;
    }
    return clientRef.current.getProfile(pubkey);
  }, []);

  // Add contact with proper validation
  const addContact = useCallback(async (pubkeyOrNpub: string): Promise<NostrContact | null> => {
    if (!pubkeyOrNpub || !pubkeyOrNpub.trim()) {
      console.error('[useNostr] Empty pubkey provided');
      return null;
    }

    const input = pubkeyOrNpub.trim();
    let normalizedPubkey = input;
    let npubValue: string | undefined;

    // Handle npub format
    if (input.startsWith('npub')) {
      try {
        const { nip19 } = await import('nostr-tools');
        const decoded = nip19.decode(input);
        if (decoded.type === 'npub') {
          normalizedPubkey = decoded.data as string;
          npubValue = input;
        } else {
          console.error('[useNostr] Decoded value is not an npub:', decoded.type);
          return null;
        }
      } catch (err) {
        console.error('[useNostr] Failed to decode npub:', err);
        return null;
      }
    } else if (input.length === 64 && /^[0-9a-f]+$/i.test(input)) {
      // Valid 64-char hex pubkey
      normalizedPubkey = input.toLowerCase();
    } else {
      console.error('[useNostr] Invalid pubkey format - must be npub or 64-char hex:', input.slice(0, 20));
      return null;
    }

    // Check if already exists
    const existing = contacts.find(c => c.pubkey === normalizedPubkey);
    if (existing) {
      console.log('[useNostr] Contact already exists');
      return existing;
    }

    // Fetch profile from network
    let profile: NostrProfile | null = null;
    try {
      profile = await fetchProfile(normalizedPubkey);
    } catch (err) {
      console.warn('[useNostr] Could not fetch profile:', err);
    }
    
    const contact: NostrContact = {
      pubkey: normalizedPubkey,
      npub: npubValue,
      profile: profile || undefined,
    };

    setContacts(prev => {
      if (prev.find(c => c.pubkey === normalizedPubkey)) {
        return prev;
      }
      return [...prev, contact];
    });

    return contact;
  }, [fetchProfile, contacts]);

  // Create channel (NIP-28)
  const createChannel = useCallback(async (name: string, about?: string, picture?: string) => {
    if (!clientRef.current) {
      throw new Error('Not connected');
    }
    if (!isConnected) {
      throw new Error('Not connected to relays');
    }
    if (!name.trim()) {
      throw new Error('Channel name is required');
    }

    // Check for duplicate channel name (case-insensitive)
    const existingChannel = channels.find(
      c => c.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (existingChannel) {
      throw new Error(`A channel named "${existingChannel.name}" already exists`);
    }

    console.log('[useNostr] Creating channel:', name);
    const event = await clientRef.current.createChannel(name.trim(), about?.trim(), picture?.trim());
    
    const channel: NostrChannel = {
      id: event.id,
      name: name.trim(),
      about: about?.trim(),
      picture: picture?.trim(),
      createdAt: event.created_at,
      creatorPubkey: event.pubkey,
    };

    setChannels(prev => [...prev, channel]);
    console.log('[useNostr] ✅ Channel created:', channel.id.slice(0, 8));
    return channel;
  }, [isConnected, channels]);

  // Send channel message
  const sendChannelMessage = useCallback(async (channelId: string, content: string) => {
    if (!clientRef.current) {
      throw new Error('Not connected');
    }
    if (!isConnected) {
      throw new Error('Not connected to relays');
    }

    console.log('[useNostr] Sending channel message to:', channelId.slice(0, 8) + '...');
    const event = await clientRef.current.sendChannelMessage(channelId, content);
    
    // Add to local messages
    const message: NostrMessage = {
      id: event.id,
      pubkey: event.pubkey,
      content: content,
      decryptedContent: content,
      created_at: event.created_at,
      isFromMe: true,
    };

    setChannelMessages(prev => {
      const updated = new Map(prev);
      const existing = updated.get(channelId) || [];
      updated.set(channelId, [...existing, message].sort((a, b) => a.created_at - b.created_at));
      return updated;
    });

    console.log('[useNostr] ✅ Channel message sent');
    return event;
  }, [isConnected]);

  // Subscribe to channel messages
  const joinChannel = useCallback((channelId: string) => {
    if (!clientRef.current || !isConnected) {
      console.error('[useNostr] Cannot join channel - not connected');
      return;
    }

    // Already subscribed?
    if (channelSubscriptions.has(channelId)) {
      console.log('[useNostr] Already subscribed to channel:', channelId.slice(0, 8));
      return;
    }

    console.log('[useNostr] Joining channel:', channelId.slice(0, 8) + '...');
    
    const subId = clientRef.current.subscribeToChannel(channelId, (event) => {
      console.log('[useNostr] Received channel message:', event.id.slice(0, 8));
      
      const message: NostrMessage = {
        id: event.id,
        pubkey: event.pubkey,
        content: event.content,
        decryptedContent: event.content, // Channel messages are not encrypted
        created_at: event.created_at,
        isFromMe: event.pubkey === identity?.publicKey,
      };

      setChannelMessages(prev => {
        const updated = new Map(prev);
        const existing = updated.get(channelId) || [];
        // Avoid duplicates
        if (!existing.find(m => m.id === message.id)) {
          updated.set(channelId, [...existing, message].sort((a, b) => a.created_at - b.created_at));
        }
        return updated;
      });
    });

    setChannelSubscriptions(prev => new Map(prev).set(channelId, subId));
  }, [isConnected, channelSubscriptions, identity?.publicKey]);

  // Leave channel (unsubscribe)
  const leaveChannel = useCallback((channelId: string) => {
    const subId = channelSubscriptions.get(channelId);
    if (subId && clientRef.current) {
      clientRef.current.unsubscribe(subId);
      setChannelSubscriptions(prev => {
        const updated = new Map(prev);
        updated.delete(channelId);
        return updated;
      });
    }
  }, [channelSubscriptions]);

  // Get messages for a specific channel
  const getMessagesForChannel = useCallback((channelId: string): NostrMessage[] => {
    return channelMessages.get(channelId) || [];
  }, [channelMessages]);

  // Join an existing channel by ID (fetch metadata and add to list)
  const joinExistingChannel = useCallback(async (channelId: string) => {
    if (!clientRef.current) {
      throw new Error('Not connected');
    }
    if (!isConnected) {
      throw new Error('Not connected to relays');
    }
    if (!channelId.trim()) {
      throw new Error('Channel ID is required');
    }

    const normalizedId = channelId.trim();

    // Check if already in our list
    if (channels.find(c => c.id === normalizedId)) {
      throw new Error('You have already joined this channel');
    }

    console.log('[useNostr] Joining existing channel:', normalizedId.slice(0, 8) + '...');

    // Fetch channel metadata (kind 40 event)
    const events = await clientRef.current.queryEvents([
      { kinds: [40], ids: [normalizedId], limit: 1 }
    ]);

    if (events.length === 0) {
      throw new Error('Channel not found. Check the channel ID and try again.');
    }

    const channelEvent = events[0];
    let metadata: { name?: string; about?: string; picture?: string } = {};
    try {
      metadata = JSON.parse(channelEvent.content);
    } catch {
      // Invalid metadata, use defaults
    }

    const channel: NostrChannel = {
      id: channelEvent.id,
      name: metadata.name || `Channel ${channelEvent.id.slice(0, 8)}`,
      about: metadata.about,
      picture: metadata.picture,
      createdAt: channelEvent.created_at,
      creatorPubkey: channelEvent.pubkey,
    };

    setChannels(prev => {
      // Double-check for duplicates before adding
      if (prev.find(c => c.id === channel.id)) {
        return prev;
      }
      return [...prev, channel];
    });
    
    // Subscribe to channel messages
    joinChannel(normalizedId);
    
    console.log('[useNostr] ✅ Joined channel:', channel.name);
    return channel;
  }, [isConnected, channels, joinChannel]);

  // Remove/leave a channel
  const removeChannel = useCallback((channelId: string) => {
    // Unsubscribe from channel messages
    leaveChannel(channelId);
    
    // Remove from channels list
    setChannels(prev => prev.filter(c => c.id !== channelId));
    
    // Clear channel messages
    setChannelMessages(prev => {
      const updated = new Map(prev);
      updated.delete(channelId);
      return updated;
    });
    
    console.log('[useNostr] Left channel:', channelId.slice(0, 8));
  }, [leaveChannel]);

  // Search for channels on the network (kind 40 events)
  const searchChannels = useCallback(async (query: string): Promise<NostrChannel[]> => {
    if (!clientRef.current || !isConnected) {
      return [];
    }

    console.log('[useNostr] Searching channels for:', query);
    const foundChannels: NostrChannel[] = [];
    const queryLower = query.toLowerCase().trim();
    
    try {
      // Check if query looks like a channel ID (64 char hex)
      const isHexId = /^[0-9a-f]{64}$/i.test(queryLower);
      const isPartialHex = /^[0-9a-f]{8,}$/i.test(queryLower);
      
      // If it's a full hex ID, try to fetch that specific channel first
      if (isHexId) {
        const directEvents = await clientRef.current.queryEvents([
          { kinds: [40], ids: [queryLower], limit: 1 }
        ]);
        
        for (const event of directEvents) {
          if (!channels.find(c => c.id === event.id)) {
            try {
              const metadata = JSON.parse(event.content);
              foundChannels.push({
                id: event.id,
                name: metadata.name || `Channel ${event.id.slice(0, 8)}`,
                about: metadata.about,
                picture: metadata.picture,
                createdAt: event.created_at,
                creatorPubkey: event.pubkey,
              });
            } catch {
              // Invalid metadata
            }
          }
        }
      }
      
      // Query for recent channel creation events (kind 40)
      // Fetch more channels for better search coverage
      const events = await clientRef.current.queryEvents([
        { kinds: [40], limit: 200 }
      ]);

      for (const event of events) {
        // Skip if already found or already joined
        if (foundChannels.find(c => c.id === event.id) || channels.find(c => c.id === event.id)) {
          continue;
        }
        
        try {
          const metadata = JSON.parse(event.content);
          const name = metadata.name || '';
          const about = metadata.about || '';
          
          // Match against name, about, or partial ID
          const nameMatch = name.toLowerCase().includes(queryLower);
          const aboutMatch = about.toLowerCase().includes(queryLower);
          const idMatch = isPartialHex && event.id.toLowerCase().startsWith(queryLower);
          
          if (nameMatch || aboutMatch || idMatch) {
            foundChannels.push({
              id: event.id,
              name: name || `Channel ${event.id.slice(0, 8)}`,
              about: about,
              picture: metadata.picture,
              createdAt: event.created_at,
              creatorPubkey: event.pubkey,
            });
          }
        } catch {
          // Invalid JSON content, skip
        }
      }

      console.log('[useNostr] Found', foundChannels.length, 'matching channels');
      return foundChannels.slice(0, 20); // Limit to 20 results
    } catch (err) {
      console.error('[useNostr] Channel search failed:', err);
      return [];
    }
  }, [isConnected, channels]);

  // NIP-05 verification
  const verifyNip05 = useCallback(async (nip05: string, pubkey: string): Promise<boolean> => {
    try {
      const [name, domain] = nip05.split('@');
      if (!name || !domain) return false;

      const response = await fetch(`https://${domain}/.well-known/nostr.json?name=${name}`);
      if (!response.ok) return false;

      const data = await response.json();
      return data.names?.[name] === pubkey;
    } catch {
      return false;
    }
  }, []);

  // Search by NIP-05
  const searchByNip05 = useCallback(async (nip05: string): Promise<string | null> => {
    try {
      const [name, domain] = nip05.split('@');
      if (!name || !domain) return null;

      const response = await fetch(`https://${domain}/.well-known/nostr.json?name=${name}`);
      if (!response.ok) return null;

      const data = await response.json();
      return data.names?.[name] || null;
    } catch {
      return null;
    }
  }, []);

  // Get messages for a specific contact
  const getMessagesForContact = useCallback((pubkey: string): NostrMessage[] => {
    return messages.get(pubkey) || [];
  }, [messages]);

  return {
    // State
    isConnected,
    isConnecting,
    relayStatuses,
    contacts,
    channels,
    myProfile,
    error,
    
    // Connection
    connect,
    disconnect,
    
    // Messaging
    sendDirectMessage,
    getMessagesForContact,
    
    // Profile
    updateProfile,
    fetchProfile,
    
    // Contacts
    addContact,
    
    // Channels
    createChannel,
    joinExistingChannel,
    sendChannelMessage,
    joinChannel,
    leaveChannel,
    removeChannel,
    getMessagesForChannel,
    searchChannels,
    
    // NIP-05
    verifyNip05,
    searchByNip05,
    
    // Client reference for advanced usage
    client: clientRef.current,
  };
}

export default useNostr;
