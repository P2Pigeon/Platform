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
 * Nostr Chat Page - Decentralized messaging using Nostr protocol
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Plug, Unplug, RefreshCw, Lock, Globe, Copy, UserPlus, Download, Check, Hash, User, MoreHorizontal, Search, Key, Shield, Menu, ArrowLeft, X, Loader2, Home, Users, Mail, Phone, FileText, Save, Paperclip, Image, File as FileIcon } from 'lucide-react';
import { useAuth, AuthStatus } from '../context/AuthContext';
import { useNostr, NostrContact, NostrMessage } from '../hooks/useNostr';
import NostrKeysRequired from '../components/NostrKeysRequired';
import { Button } from '../components/ui/button';
import QRCode from 'qrcode';
import { loadContacts, saveContacts as saveContactsToStorage, StoredContact } from '../services/contactsStorage';

const MESSAGES_STORAGE_KEY = 'pigeon_nostr_messages';

const NostrChatPage: React.FC = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { identity, status: authStatus, createIdentity, signInWithPrivateKey } = useAuth();
  const { isConnected, isConnecting, relayStatuses, contacts, channels, myProfile, error, connect, disconnect, sendDirectMessage, getMessagesForContact, updateProfile, fetchProfile, addContact, createChannel, joinExistingChannel, sendChannelMessage, joinChannel, getMessagesForChannel, verifyNip05, searchByNip05, searchChannels, removeChannel } = useNostr();

  const [selectedContact, setSelectedContact] = useState<NostrContact | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [newContactInput, setNewContactInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'dms' | 'channels'>('dms');
  const [profileName, setProfileName] = useState('');
  const [profileAbout, setProfileAbout] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [profileNip05, setProfileNip05] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<'nsec' | 'npub' | null>(null);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelAbout, setNewChannelAbout] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isKeyBackupOpen, setIsKeyBackupOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isNewChannelOpen, setIsNewChannelOpen] = useState(false);
  const [isJoinChannelOpen, setIsJoinChannelOpen] = useState(false);
  const [joinChannelId, setJoinChannelId] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showRelayDropdown, setShowRelayDropdown] = useState(false);
  const [selectedRelays, setSelectedRelays] = useState<string[]>([
    'wss://relay.damus.io',
    'wss://relay.nostr.band',
    'wss://nos.lol',
  ]);
  
  // Contact form state (same as ContactsPage)
  const [storedContacts, setStoredContacts] = useState<StoredContact[]>([]);
  const [formNpub, setFormNpub] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDetails, setFormDetails] = useState('');
  
  // Network search state
  const [isSearching, setIsSearching] = useState(false);
  const [networkSearchResult, setNetworkSearchResult] = useState<{ pubkey: string; name?: string; nip05?: string } | null>(null);
  
  // Channel search state
  const [channelSearchResults, setChannelSearchResults] = useState<Array<{ id: string; name: string; about?: string; creatorPubkey: string }>>([]);
  const [isSearchingChannels, setIsSearchingChannels] = useState(false);
  
  // Lightbox state for viewing full-size images
  const [lightboxImage, setLightboxImage] = useState<{ src: string; name: string } | null>(null);

  // Available public Nostr relays
  const AVAILABLE_RELAYS = [
    'wss://relay.damus.io',
    'wss://relay.nostr.band',
    'wss://nos.lol',
    'wss://relay.snort.social',
    'wss://nostr.wine',
    'wss://relay.primal.net',
    'wss://nostr-pub.wellorder.net',
    'wss://relay.nostr.info',
    'wss://nostr.bitcoiner.social',
    'wss://relay.current.fyi',
  ];

  const toggleRelay = (relay: string) => {
    setSelectedRelays(prev => {
      if (prev.includes(relay)) {
        return prev.filter(r => r !== relay);
      } else if (prev.length < 5) {
        return [...prev, relay];
      }
      return prev; // Max 5 relays
    });
  };

  // Load stored contacts on mount
  useEffect(() => {
    if (identity?.publicKey) {
      setStoredContacts(loadContacts(identity.publicKey));
    }
  }, [identity?.publicKey]);

  // Reset contact form
  const resetContactForm = () => {
    setFormNpub('');
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormDetails('');
  };

  // Network search - debounced lookup for NIP-05, npub, hex, or username
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 3) {
      setNetworkSearchResult(null);
      return;
    }

    // Check input format
    const isNip05 = searchQuery.includes('@');
    const isNpub = searchQuery.startsWith('npub');
    const isHex = /^[0-9a-f]{64}$/i.test(searchQuery);
    const isUsername = !isNip05 && !isNpub && !isHex && /^[a-zA-Z0-9_]+$/.test(searchQuery);

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        if (isNip05) {
          // Direct NIP-05 lookup (user@domain.com)
          const pubkey = await searchByNip05(searchQuery);
          if (pubkey) {
            const profile = await fetchProfile(pubkey);
            setNetworkSearchResult({
              pubkey,
              name: profile?.name,
              nip05: searchQuery
            });
          } else {
            setNetworkSearchResult(null);
          }
        } else if (isNpub || isHex) {
          // Direct pubkey lookup
          let pubkey = searchQuery;
          if (isNpub) {
            try {
              const { nip19 } = await import('nostr-tools');
              const decoded = nip19.decode(searchQuery);
              if (decoded.type === 'npub') {
                pubkey = decoded.data as string;
              }
            } catch {
              setNetworkSearchResult(null);
              return;
            }
          }
          const profile = await fetchProfile(pubkey);
          if (profile) {
            setNetworkSearchResult({
              pubkey,
              name: profile?.name,
              nip05: profile?.nip05
            });
          } else {
            setNetworkSearchResult(null);
          }
        } else if (isUsername) {
          // Try common NIP-05 domains for username search
          const commonDomains = [
            'nostr.band',
            'iris.to', 
            'snort.social',
            'primal.net',
            'nostrplebs.com',
            'getalby.com'
          ];
          
          for (const domain of commonDomains) {
            const nip05 = `${searchQuery}@${domain}`;
            try {
              const pubkey = await searchByNip05(nip05);
              if (pubkey) {
                const profile = await fetchProfile(pubkey);
                setNetworkSearchResult({
                  pubkey,
                  name: profile?.name || searchQuery,
                  nip05
                });
                return; // Found one, stop searching
              }
            } catch {
              // Try next domain
            }
          }
          setNetworkSearchResult(null);
        }
      } catch (err) {
        console.error('[NostrChat] Network search failed:', err);
        setNetworkSearchResult(null);
      } finally {
        setIsSearching(false);
      }
    }, 600); // 600ms debounce for username search

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchByNip05, fetchProfile]);

  // Channel search - search the network when in channels tab
  useEffect(() => {
    if (activeTab !== 'channels' || !searchQuery || searchQuery.length < 2 || !isConnected) {
      setChannelSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearchingChannels(true);
      try {
        const results = await searchChannels(searchQuery);
        setChannelSearchResults(results);
      } catch (err) {
        console.error('[NostrChat] Channel search failed:', err);
        setChannelSearchResults([]);
      } finally {
        setIsSearchingChannels(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeTab, isConnected, searchChannels]);

  // Save contact to shared storage (same as ContactsPage)
  const handleSaveContactToStorage = async () => {
    if (!formNpub.trim() || !formName.trim()) {
      showNotification('error', 'Nostr pubkey and name are required');
      return;
    }
    if (!identity?.publicKey) return;

    // Check for duplicate npub
    if (storedContacts.some(c => c.npub === formNpub)) {
      showNotification('error', 'A contact with this pubkey already exists');
      return;
    }

    const now = Date.now();
    const newContact: StoredContact = {
      id: `${now}-${Math.random().toString(36).slice(2, 9)}`,
      npub: formNpub,
      name: formName,
      email: formEmail || undefined,
      phone: formPhone || undefined,
      details: formDetails || undefined,
      createdAt: now,
      updatedAt: now
    };

    const updated = [...storedContacts, newContact];
    saveContactsToStorage(updated, identity.publicKey);
    setStoredContacts(updated);
    
    // Also add to Nostr contacts for chat and start chat with them
    const nostrContact = await addContact(formNpub);
    if (nostrContact) {
      setSelectedContact(nostrContact);
      showNotification('success', `Contact "${formName}" added! Starting chat...`);
    } else {
      showNotification('warning', `Contact saved but key format invalid for chat. Check the npub.`);
    }
    
    setIsAddContactOpen(false);
    resetContactForm();
  };

  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // File upload handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Supported file types for Nostr (typically shared as base64 or links)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];
    const maxSize = 100 * 1024; // 100KB limit - some relays reject larger events

    if (!allowedTypes.includes(file.type)) {
      showNotification('error', 'Unsupported file type. Allowed: JPG, PNG, GIF, WebP, PDF, TXT');
      return;
    }

    if (file.size > maxSize) {
      showNotification('error', 'File too large. Max size: 100KB (Nostr relay limit)');
      return;
    }

    try {
      // Convert to base64 and send as message
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const fileMessage = `[FILE:${file.name}:${file.type}]\n${base64}`;
        
        if (selectedContact) {
          await sendDirectMessage(selectedContact.pubkey, fileMessage);
          showNotification('success', `File "${file.name}" sent!`);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      showNotification('error', 'Failed to send file');
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Messages for selected contact or channel
  const currentMessages = selectedContact 
    ? getMessagesForContact(selectedContact.pubkey)
    : [];
  
  const currentChannelMessages = selectedChannel
    ? getMessagesForChannel(selectedChannel)
    : [];

  // Save messages to localStorage for persistence
  useEffect(() => {
    if (identity?.publicKey && currentMessages.length > 0 && selectedContact) {
      const key = `${MESSAGES_STORAGE_KEY}_${identity.publicKey}_${selectedContact.pubkey}`;
      try {
        localStorage.setItem(key, JSON.stringify(currentMessages.slice(-100))); // Keep last 100 messages
      } catch (err) {
        console.warn('Failed to persist messages:', err);
      }
    }
  }, [currentMessages, identity?.publicKey, selectedContact]);

  // Join channel when selected
  useEffect(() => {
    if (selectedChannel && isConnected) {
      joinChannel(selectedChannel);
    }
  }, [selectedChannel, isConnected, joinChannel]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, currentChannelMessages]);

  // Load profile data when opening edit
  useEffect(() => {
    if (myProfile) {
      setProfileName(myProfile.name || '');
      setProfileAbout(myProfile.about || '');
      setProfilePicture(myProfile.picture || '');
      setProfileNip05(myProfile.nip05 || '');
    }
  }, [myProfile]);

  // Generate QR code for key backup
  useEffect(() => {
    if (isKeyBackupOpen && identity?.nsec) {
      QRCode.toDataURL(identity.nsec, { width: 256, margin: 2 })
        .then(setQrCodeUrl)
        .catch(console.error);
    }
  }, [isKeyBackupOpen, identity?.nsec]);

  // Auto-connect when user has identity
  useEffect(() => {
    if (identity && authStatus === AuthStatus.AUTHENTICATED && !isConnected && !isConnecting) {
      connect().then(success => {
        if (success) {
          showNotification('success', 'Connected to Nostr relays');
        }
      });
    }
  }, [identity, authStatus, isConnected, isConnecting]);

  const handleConnect = async () => {
    const success = await connect();
    if (success) showNotification('success', `Connected to ${relayStatuses.filter(r => r.status === 'connected').length} relays`);
    else if (error) showNotification('error', error);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!isConnected) {
      showNotification('error', 'Not connected to relays. Please connect first.');
      return;
    }
    
    try {
      if (selectedContact) {
        console.log('[NostrChatPage] Sending DM...');
        await sendDirectMessage(selectedContact.pubkey, newMessage);
      } else if (selectedChannel) {
        console.log('[NostrChatPage] Sending channel message...');
        await sendChannelMessage(selectedChannel, newMessage);
      } else {
        return;
      }
      setNewMessage('');
      console.log('[NostrChatPage] Message sent successfully');
    } catch (err) {
      console.error('[NostrChatPage] Failed to send:', err);
      showNotification('error', err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const handleAddContact = async () => {
    if (!newContactInput.trim()) return;
    try {
      if (newContactInput.includes('@')) {
        const pubkey = await searchByNip05(newContactInput);
        if (!pubkey) { showNotification('warning', 'Could not find user'); return; }
        await addContact(pubkey);
      } else {
        await addContact(newContactInput);
      }
      setNewContactInput('');
      setIsAddContactOpen(false);
      showNotification('success', 'Contact added');
    } catch (err) {
      showNotification('error', 'Failed to add contact');
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile({ name: profileName, about: profileAbout, picture: profilePicture, nip05: profileNip05 });
      setIsProfileOpen(false);
      showNotification('success', 'Profile updated');
    } catch (err) {
      showNotification('error', 'Failed to save profile');
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) {
      showNotification('error', 'Channel name is required');
      return;
    }
    try {
      await createChannel(newChannelName, newChannelAbout);
      setNewChannelName('');
      setNewChannelAbout('');
      setIsNewChannelOpen(false);
      showNotification('success', `Channel "${newChannelName}" created`);
    } catch (err) {
      console.error('[NostrChatPage] Failed to create channel:', err);
      showNotification('error', err instanceof Error ? err.message : 'Failed to create channel');
    }
  };

  const handleJoinChannel = async () => {
    if (!joinChannelId.trim()) {
      showNotification('error', 'Channel ID is required');
      return;
    }
    try {
      const channel = await joinExistingChannel(joinChannelId);
      setJoinChannelId('');
      setIsJoinChannelOpen(false);
      setSelectedChannel(channel.id);
      showNotification('success', `Joined channel "${channel.name}"`);
    } catch (err) {
      console.error('[NostrChatPage] Failed to join channel:', err);
      showNotification('error', err instanceof Error ? err.message : 'Failed to join channel');
    }
  };

  // Copy key to clipboard
  const copyKey = async (type: 'nsec' | 'npub') => {
    const key = type === 'nsec' ? identity?.nsec : identity?.npub;
    if (key) {
      await navigator.clipboard.writeText(key);
      setCopiedKey(type);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // Export keys to file
  const exportKeys = () => {
    if (!identity) return;
    
    const keyData = {
      npub: identity.npub,
      nsec: identity.nsec,
      publicKey: identity.publicKey,
      createdAt: new Date().toISOString(),
      warning: 'KEEP THIS FILE SECURE! Anyone with your nsec can access your identity.',
    };
    
    const blob = new Blob([JSON.stringify(keyData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nostr-keys-${identity.npub.slice(0, 12)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Truncate pubkey for display
  const truncatePubkey = (pubkey: string) => {
    return `${pubkey.slice(0, 8)}...${pubkey.slice(-4)}`;
  };

  const isGuest = authStatus === AuthStatus.GUEST || !identity;

  if (isGuest) {
    return (
      <NostrKeysRequired 
        onCreateIdentity={createIdentity}
        onImportKey={signInWithPrivateKey}
      />
    );
  }

  return (
    <div className="h-full p-4">
      <div className="h-full flex rounded-xl overflow-hidden border border-white/10 bg-pigeon-bg-elevated">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl backdrop-blur-xl border animate-slide-down ${notification.type === 'success' ? 'bg-pigeon-success/20 text-pigeon-success border-pigeon-success/30' : notification.type === 'error' ? 'bg-pigeon-danger/20 text-pigeon-danger border-pigeon-danger/30' : notification.type === 'warning' ? 'bg-pigeon-accent/20 text-pigeon-accent border-pigeon-accent/30' : 'bg-pigeon-primary/20 text-pigeon-primary border-pigeon-primary/30'}`}>
          {notification.message}
        </div>
      )}

      {/* Mobile Contacts Drawer */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85%] bg-pigeon-bg-elevated flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-pigeon-primary-light font-semibold">Nostr Chat</h2>
              <button onClick={() => setIsSidebarOpen(false)} className="text-pigeon-text-secondary hover:text-pigeon-text"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 border-b border-white/10">
              {!isConnected ? (
                <Button onClick={() => { handleConnect(); setIsSidebarOpen(false); }} disabled={isConnecting} className="w-full">
                  {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />} Connect
                </Button>
              ) : (
                <Button onClick={() => { disconnect(); setIsSidebarOpen(false); }} variant="destructive" className="w-full">
                  <Unplug className="w-4 h-4" /> Disconnect
                </Button>
              )}
            </div>
            <div className="p-3 bg-pigeon-surface/50 border-b border-white/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-pigeon-primary flex items-center justify-center text-pigeon-text text-sm font-bold">{(myProfile?.name || 'A')[0].toUpperCase()}</div>
              <div className="flex-1"><p className="text-sm text-pigeon-text font-bold">{myProfile?.name || 'Anonymous'}</p></div>
              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)} className="p-1 text-pigeon-text-secondary hover:text-pigeon-text"><MoreHorizontal className="w-4 h-4" /></button>
                {showMenu && (
                  <div className="absolute right-0 top-8 bg-pigeon-surface border border-white/5 rounded-lg shadow-lg z-10 min-w-[140px]">
                    <button onClick={() => { setIsProfileOpen(true); setIsSidebarOpen(false); setShowMenu(false); }} className="w-full px-4 py-2 text-left text-sm text-pigeon-text-secondary hover:bg-white/10 flex items-center gap-2"><User className="w-4 h-4" /> Edit Profile</button>
                    <button onClick={() => { setIsKeyBackupOpen(true); setIsSidebarOpen(false); setShowMenu(false); }} className="w-full px-4 py-2 text-left text-sm text-pigeon-text-secondary hover:bg-white/10 flex items-center gap-2"><Key className="w-4 h-4" /> Backup Keys</button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {contacts.map(contact => (
                <div key={contact.pubkey} onClick={() => { setSelectedContact(contact); setIsSidebarOpen(false); }} className="p-3 cursor-pointer hover:bg-pigeon-surface flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-pigeon-text text-sm">{(contact.profile?.name || contact.pubkey)[0].toUpperCase()}</div>
                  <span className="text-sm text-pigeon-text">{contact.profile?.name || truncatePubkey(contact.pubkey)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-80 min-w-[320px] bg-pigeon-bg-elevated border-r border-white/10 flex-col">
        <div className="p-4 border-b border-white/10">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/app')} className="p-2 rounded-lg text-pigeon-text-secondary hover:text-pigeon-text hover:bg-white/5 transition-all" title="Back to Dashboard">
                <Home className="w-4 h-4" />
              </button>
              <h1 className="text-lg font-semibold text-pigeon-primary-light">Nostr Chat</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${isConnected ? 'bg-pigeon-success/20 text-pigeon-success' : 'bg-pigeon-danger/20 text-pigeon-danger'}`}>
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                {isConnected ? 'Online' : 'Offline'}
              </span>
              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)} className="p-1 text-pigeon-text-secondary hover:text-pigeon-text"><MoreHorizontal className="w-4 h-4" /></button>
                {showMenu && (
                  <div className="absolute right-0 top-8 bg-pigeon-surface border border-white/5 rounded-lg shadow-lg z-10 min-w-[140px]">
                    <button onClick={() => { setIsProfileOpen(true); setShowMenu(false); }} className="w-full px-4 py-2 text-left text-sm text-pigeon-text-secondary hover:bg-white/10 flex items-center gap-2"><User className="w-4 h-4" /> Edit Profile</button>
                    <button onClick={() => { setIsKeyBackupOpen(true); setShowMenu(false); }} className="w-full px-4 py-2 text-left text-sm text-pigeon-text-secondary hover:bg-white/10 flex items-center gap-2"><Key className="w-4 h-4" /> Backup Keys</button>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Relay Selector with Refresh Button */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <button
                onClick={() => setShowRelayDropdown(!showRelayDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 bg-pigeon-surface rounded-lg text-sm text-pigeon-text hover:bg-white/10 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-pigeon-primary" />
                  <span>{selectedRelays.length} relay{selectedRelays.length !== 1 ? 's' : ''} selected</span>
                </span>
                <span className={`transition-transform ${showRelayDropdown ? 'rotate-180' : ''}`}>▼</span>
              </button>
              
              {showRelayDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-pigeon-surface border border-white/10 rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto">
                  <div className="p-2 border-b border-white/10 text-xs text-pigeon-text-muted">
                    Select up to 5 relays
                  </div>
                  {AVAILABLE_RELAYS.map(relay => (
                    <button
                      key={relay}
                      onClick={() => toggleRelay(relay)}
                      disabled={!selectedRelays.includes(relay) && selectedRelays.length >= 5}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-white/5 transition-colors ${
                        selectedRelays.includes(relay) ? 'text-pigeon-primary' : 'text-pigeon-text-secondary'
                      } ${!selectedRelays.includes(relay) && selectedRelays.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                        selectedRelays.includes(relay) ? 'bg-pigeon-primary border-pigeon-primary' : 'border-white/20'
                      }`}>
                        {selectedRelays.includes(relay) && <Check className="w-3 h-3 text-white" />}
                      </span>
                      <span className="truncate">{relay.replace('wss://', '')}</span>
                      {relayStatuses.find(r => r.url === relay)?.status === 'connected' && (
                        <span className="w-2 h-2 rounded-full bg-green-400 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button 
              onClick={handleConnect} 
              disabled={isConnecting || selectedRelays.length === 0} 
              size="icon"
              className="w-10 h-10 shrink-0"
              title={isConnected ? 'Reconnect' : 'Connect'}
            >
              {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="p-3 bg-pigeon-surface/50 border-b border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-pigeon-primary flex items-center justify-center text-pigeon-text text-sm font-bold">{(myProfile?.name || 'A')[0].toUpperCase()}</div>
          <div className="flex-1">
            <p className="text-sm text-pigeon-text font-bold">{myProfile?.name || 'Anonymous'}</p>
            <p className="text-xs text-pigeon-text-secondary font-mono">{identity?.npub ? truncatePubkey(identity.npub) : ''}</p>
          </div>
          <button onClick={() => copyKey('npub')} title="Copy npub" className="p-1 text-pigeon-text-secondary hover:text-pigeon-text"><Copy className="w-4 h-4" /></button>
        </div>

        <div className="flex p-2 gap-1">
          <button onClick={() => setActiveTab('dms')} className={`flex-1 px-4 py-2 text-sm rounded-lg ${activeTab === 'dms' ? 'bg-pigeon-primary text-pigeon-text' : 'text-pigeon-text-secondary hover:bg-pigeon-surface'}`}>DMs</button>
          <button onClick={() => setActiveTab('channels')} className={`flex-1 px-4 py-2 text-sm rounded-lg ${activeTab === 'channels' ? 'bg-pigeon-primary text-pigeon-text' : 'text-pigeon-text-secondary hover:bg-pigeon-surface'}`}>Channels</button>
        </div>

        <div className="px-3 pb-2">
          <div className="relative">
            <input 
              type="text" 
              placeholder={activeTab === 'dms' ? 'Search or enter npub/NIP-05...' : 'Search channels...'} 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full px-3 py-2 pr-10 bg-pigeon-surface rounded text-sm text-pigeon-text placeholder-pigeon-text-muted focus:outline-none" 
            />
            {isSearching ? (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pigeon-primary animate-spin" />
            ) : (
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pigeon-text-muted" />
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'dms' ? (
            <>
              <div className="p-2">
                <Button onClick={() => setIsAddContactOpen(true)} variant="outline" className="w-full"><UserPlus className="w-4 h-4" /> Add Contact</Button>
              </div>
              <div className="border-t border-white/5" />
              
              {/* Network search result */}
              {networkSearchResult && (
                <div 
                  onClick={async () => {
                    const contact = await addContact(networkSearchResult.pubkey);
                    if (contact) {
                      setSelectedContact(contact);
                      setSearchQuery('');
                      setNetworkSearchResult(null);
                      showNotification('success', `Starting chat with ${networkSearchResult.name || 'user'}...`);
                    } else {
                      showNotification('error', 'Failed to add contact');
                    }
                  }} 
                  className="mx-2 mb-1 p-3 rounded-md cursor-pointer bg-pigeon-primary/10 hover:bg-pigeon-primary/20 border border-pigeon-primary/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-pigeon-text text-sm">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-pigeon-text font-medium">{networkSearchResult.name || 'Unknown'}</p>
                      <p className="text-xs text-pigeon-primary">
                        {networkSearchResult.nip05 || `${networkSearchResult.pubkey.slice(0, 12)}...`}
                      </p>
                      <p className="text-xs text-pigeon-text-muted">Found on network • Click to chat</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Show stored contacts from ContactsPage that match search */}
              {searchQuery && storedContacts.filter(sc => 
                sc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sc.npub.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sc.email?.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(sc => (
                <div 
                  key={sc.id} 
                  onClick={async () => {
                    // Start chat with this stored contact
                    const contact = await addContact(sc.npub);
                    if (contact) {
                      setSelectedContact(contact);
                      showNotification('success', `Starting chat with ${sc.name}`);
                    } else {
                      showNotification('error', `Invalid key format for ${sc.name}`);
                    }
                  }} 
                  className="mx-2 mb-1 p-3 rounded-md cursor-pointer hover:bg-pigeon-surface border border-dashed border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-pigeon-text text-sm">{sc.name[0].toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-pigeon-text font-medium">{sc.name}</p>
                      <p className="text-xs text-pigeon-text-muted">From Contacts • Click to chat</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {contacts.length === 0 && (!searchQuery || storedContacts.filter(sc => 
                sc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sc.npub.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0) ? (
                <div className="p-4 text-center"><p className="text-pigeon-text-muted text-sm">No contacts yet</p><p className="text-pigeon-text-muted text-xs">Add someone to start chatting</p></div>
              ) : (
                contacts.filter(c => !searchQuery || c.profile?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.pubkey.includes(searchQuery)).map(contact => (
                  <div key={contact.pubkey} onClick={() => setSelectedContact(contact)} className={`mx-2 mb-1 p-3 rounded-md cursor-pointer ${selectedContact?.pubkey === contact.pubkey ? 'bg-pigeon-primary/20' : 'hover:bg-pigeon-surface'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-pigeon-text text-sm">{(contact.profile?.name || contact.pubkey)[0].toUpperCase()}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-pigeon-text font-medium">{contact.profile?.name || truncatePubkey(contact.pubkey)}</p>
                        {contact.lastMessage && <p className="text-xs text-pigeon-text-secondary truncate">{contact.lastMessage}</p>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          ) : (
            <>
              <div className="p-2 space-y-2">
                <Button onClick={() => setIsNewChannelOpen(true)} variant="outline" className="w-full"><Hash className="w-4 h-4" /> Create Channel</Button>
                <Button onClick={() => setIsJoinChannelOpen(true)} variant="secondary" className="w-full"><UserPlus className="w-4 h-4" /> Join by ID</Button>
              </div>
              <div className="border-t border-white/5" />
              
              {/* Channel search results from network */}
              {isSearchingChannels && (
                <div className="p-3 text-center">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-pigeon-primary" />
                  <p className="text-xs text-pigeon-text-muted mt-1">Searching network...</p>
                </div>
              )}
              
              {channelSearchResults.length > 0 && (
                <div className="mx-2 mb-2">
                  <p className="text-xs text-pigeon-text-muted mb-2 px-1">Found on network:</p>
                  {channelSearchResults.map(channel => (
                    <div 
                      key={channel.id} 
                      onClick={async () => {
                        try {
                          await joinExistingChannel(channel.id);
                          setSearchQuery('');
                          setChannelSearchResults([]);
                          setSelectedChannel(channel.id);
                          showNotification('success', `Joined "${channel.name}"`);
                        } catch (err) {
                          showNotification('error', err instanceof Error ? err.message : 'Failed to join');
                        }
                      }} 
                      className="p-3 mb-1 rounded-md cursor-pointer bg-pigeon-primary/10 hover:bg-pigeon-primary/20 border border-pigeon-primary/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                          <Globe className="w-4 h-4 text-pigeon-text" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-pigeon-text font-medium">{channel.name}</p>
                          {channel.about && <p className="text-xs text-pigeon-text-secondary truncate">{channel.about}</p>}
                          <p className="text-xs text-pigeon-primary">Click to join</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Existing joined channels */}
              {channels.length === 0 && channelSearchResults.length === 0 && !isSearchingChannels ? (
                <div className="p-4 text-center">
                  <p className="text-pigeon-text-muted text-sm">No channels yet</p>
                  <p className="text-pigeon-text-muted text-xs">Search to discover or create one</p>
                </div>
              ) : (
                <>
                  {channels.length > 0 && <p className="text-xs text-pigeon-text-muted mx-3 mb-1">Your channels:</p>}
                  {channels.filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(channel => (
                    <div key={channel.id} className={`mx-2 mb-1 p-3 rounded-md ${selectedChannel === channel.id ? 'bg-pigeon-primary/20' : 'hover:bg-pigeon-surface'} group`}>
                      <div className="flex items-center gap-3">
                        <div 
                          onClick={() => setSelectedChannel(channel.id)} 
                          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0"><Hash className="w-4 h-4 text-pigeon-text" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-pigeon-text font-medium">{channel.name}</p>
                            {channel.about && <p className="text-xs text-pigeon-text-secondary truncate">{channel.about}</p>}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedChannel === channel.id) setSelectedChannel(null);
                            removeChannel(channel.id);
                            showNotification('info', `Left "${channel.name}"`);
                          }}
                          className="p-1.5 text-pigeon-text-muted hover:text-pigeon-danger hover:bg-pigeon-danger/10 rounded opacity-0 group-hover:opacity-100 transition-all"
                          title="Leave channel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>

        <div className="p-3 border-t border-white/10">
          <p className="text-xs text-pigeon-text-muted mb-2">Selected Relays ({selectedRelays.length}/5)</p>
          <div className="flex flex-wrap gap-1">
            {selectedRelays.map(relay => {
              const status = relayStatuses.find(r => r.url === relay)?.status;
              return (
                <span key={relay} title={relay} className={`px-2 py-0.5 text-xs rounded ${status === 'connected' ? 'bg-pigeon-success/20 text-pigeon-success' : status === 'connecting' ? 'bg-yellow-600/30 text-yellow-300' : status === 'error' ? 'bg-pigeon-danger/20 text-pigeon-danger' : 'bg-pigeon-surface-light/30 text-pigeon-text-secondary'}`}>
                  {relay.replace('wss://', '').split('.')[0]}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile: Show contacts button when no selection */}
        {!selectedContact && !selectedChannel && (
          <div className="md:hidden p-4 border-b border-white/10 bg-pigeon-bg-elevated flex items-center justify-between">
            <button onClick={() => setIsSidebarOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-pigeon-surface rounded-lg text-pigeon-text">
              <Users className="w-4 h-4" />
              <span>Contacts</span>
            </button>
            <span className={`badge ${isConnected ? 'badge-success' : 'badge-danger'}`}>{isConnected ? 'Online' : 'Offline'}</span>
          </div>
        )}
        {selectedContact ? (
          <>
            {/* DM Header */}
            <div className="p-4 border-b border-white/10 bg-pigeon-bg-elevated flex items-center gap-3">
              <button onClick={() => setSelectedContact(null)} className="md:hidden p-2 text-pigeon-text-secondary hover:text-pigeon-text"><ArrowLeft className="w-5 h-5" /></button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-pigeon-text">{(selectedContact.profile?.name || selectedContact.pubkey)[0].toUpperCase()}</div>
              <div>
                <p className="font-bold text-pigeon-text">{selectedContact.profile?.name || truncatePubkey(selectedContact.pubkey)}</p>
                <p className="flex items-center gap-1 text-xs text-pigeon-success"><Lock className="w-3 h-3" /> End-to-end encrypted</p>
              </div>
            </div>

            {/* DM Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-pigeon-bg">
              {currentMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <Lock className="w-12 h-12 text-pigeon-text-muted mb-4" />
                  <p className="text-pigeon-text-muted">No messages yet</p>
                  <p className="text-pigeon-text-muted text-sm">Messages are end-to-end encrypted with NIP-04</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentMessages.map(msg => {
                    // Check if this is a file message
                    const isFileMessage = msg.decryptedContent?.startsWith('[FILE:') ?? false;
                    let fileName = '';
                    let fileType = '';
                    let fileData = '';
                    
                    if (isFileMessage) {
                      const match = msg.decryptedContent?.match(/^\[FILE:([^:]+):([^\]]+)\]\n(.+)$/s);
                      if (match) {
                        fileName = match[1];
                        fileType = match[2];
                        fileData = match[3];
                      }
                    }
                    
                    return (
                      <div key={msg.id} className={`flex ${msg.isFromMe ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[70%]">
                          <div className={`p-3 ${msg.isFromMe ? 'bg-pigeon-primary rounded-lg rounded-br-none' : 'bg-pigeon-surface rounded-lg rounded-bl-none'}`}>
                            {isFileMessage && fileData ? (
                              fileType.startsWith('image/') ? (
                                <div>
                                  <img 
                                    src={fileData} 
                                    alt={fileName} 
                                    className="max-w-full rounded max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity" 
                                    onClick={() => setLightboxImage({ src: fileData, name: fileName })}
                                  />
                                  <p className="text-xs text-pigeon-text-secondary mt-1 flex items-center gap-1">
                                    <Image className="w-3 h-3" /> {fileName}
                                  </p>
                                </div>
                              ) : (
                                <a href={fileData} download={fileName} className="flex items-center gap-2 text-pigeon-text hover:underline">
                                  <FileIcon className="w-5 h-5" />
                                  <span>{fileName}</span>
                                </a>
                              )
                            ) : (
                              <p className="text-pigeon-text">{msg.decryptedContent}</p>
                            )}
                          </div>
                          <p className={`text-xs text-pigeon-text-muted mt-1 ${msg.isFromMe ? 'text-right' : 'text-left'}`}>{formatTime(msg.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* DM Input */}
            <div className="p-4 border-t border-white/10 bg-pigeon-bg-elevated">
              {!isConnected && (
                <div className="mb-2 p-2 rounded bg-pigeon-danger/10 text-pigeon-danger text-sm text-center">
                  Not connected to relays. <button onClick={handleConnect} className="underline font-medium">Connect now</button>
                </div>
              )}
              <div className="flex gap-2">
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain"
                  onChange={handleFileSelect}
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={!isConnected}
                  className="p-2 text-pigeon-text-secondary hover:text-pigeon-text hover:bg-white/5 rounded disabled:opacity-50"
                  title="Attach file (JPG, PNG, GIF, WebP, PDF, TXT - max 1MB)"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input type="text" placeholder={isConnected ? "Type a message..." : "Connect to send messages..."} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && isConnected && handleSendMessage()} disabled={!isConnected} className="flex-1 px-4 py-2 bg-pigeon-surface rounded text-pigeon-text placeholder-pigeon-text-muted focus:outline-none disabled:opacity-50" />
                <button onClick={handleSendMessage} disabled={!newMessage.trim() || !isConnected} className="p-2 bg-pigeon-primary text-pigeon-text rounded hover:bg-pigeon-primary-dark disabled:opacity-50"><Send className="w-5 h-5" /></button>
              </div>
            </div>
          </>
        ) : selectedChannel ? (
          <>
            {/* Channel Header */}
            <div className="p-4 border-b border-white/10 bg-pigeon-bg-elevated flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedChannel(null)} className="md:hidden p-2 text-pigeon-text-secondary hover:text-pigeon-text"><ArrowLeft className="w-5 h-5" /></button>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center"><Hash className="w-5 h-5 text-white" /></div>
                <div>
                  <p className="font-bold text-pigeon-text">{channels.find(c => c.id === selectedChannel)?.name || 'Channel'}</p>
                  <p className="text-xs text-pigeon-text-secondary">{channels.find(c => c.id === selectedChannel)?.about || 'Public channel'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(selectedChannel);
                    showNotification('success', 'Channel ID copied!');
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs bg-pigeon-surface rounded-lg text-pigeon-text-secondary hover:text-pigeon-text hover:bg-white/10 transition-colors"
                  title="Copy Channel ID"
                >
                  <span className="font-mono truncate max-w-[80px]">{selectedChannel.slice(0, 8)}...</span>
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => {
                    removeChannel(selectedChannel);
                    setSelectedChannel(null);
                    showNotification('info', 'Left channel');
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-pigeon-danger/20 text-pigeon-danger rounded-lg hover:bg-pigeon-danger/30 transition-colors"
                  title="Leave Channel"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Leave</span>
                </button>
              </div>
            </div>

            {/* Channel Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-pigeon-bg">
              {currentChannelMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <Hash className="w-12 h-12 text-pigeon-text-muted mb-4" />
                  <p className="text-pigeon-text-muted">No messages yet</p>
                  <p className="text-pigeon-text-muted text-sm">Be the first to send a message!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentChannelMessages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.isFromMe ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[70%]">
                        {!msg.isFromMe && (
                          <p className="text-xs text-pigeon-text-muted mb-1">{msg.pubkey.slice(0, 8)}...</p>
                        )}
                        <div className={`p-3 ${msg.isFromMe ? 'bg-pigeon-primary rounded-lg rounded-br-none' : 'bg-pigeon-surface rounded-lg rounded-bl-none'}`}>
                          <p className="text-pigeon-text">{msg.decryptedContent || msg.content}</p>
                        </div>
                        <p className={`text-xs text-pigeon-text-muted mt-1 ${msg.isFromMe ? 'text-right' : 'text-left'}`}>{formatTime(msg.created_at)}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Channel Input */}
            <div className="p-4 border-t border-white/10 bg-pigeon-bg-elevated">
              {!isConnected && (
                <div className="mb-2 p-2 rounded bg-pigeon-danger/10 text-pigeon-danger text-sm text-center">
                  Not connected to relays. <button onClick={handleConnect} className="underline font-medium">Connect now</button>
                </div>
              )}
              <div className="flex gap-2">
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={!isConnected}
                  className="p-2 text-pigeon-text-secondary hover:text-pigeon-text hover:bg-white/5 rounded disabled:opacity-50"
                  title="Attach file (JPG, PNG, GIF, WebP, PDF, TXT - max 100KB)"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input type="text" placeholder={isConnected ? "Message channel..." : "Connect to send messages..."} value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && isConnected && handleSendMessage()} disabled={!isConnected} className="flex-1 px-4 py-2 bg-pigeon-surface rounded text-pigeon-text placeholder-pigeon-text-muted focus:outline-none disabled:opacity-50" />
                <button onClick={handleSendMessage} disabled={!newMessage.trim() || !isConnected} className="p-2 bg-pigeon-primary text-pigeon-text rounded hover:bg-pigeon-primary-dark disabled:opacity-50"><Send className="w-5 h-5" /></button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-pigeon-bg">
            <Globe className="w-16 h-16 text-pigeon-text-muted mb-4" />
            <p className="text-pigeon-text-muted text-lg">Select a conversation</p>
            <p className="text-pigeon-text-muted text-sm">Or add a new contact to start chatting</p>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsProfileOpen(false)}>
          <div className="bg-gray-800 rounded-lg w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4">
              <h2 className="text-pigeon-text font-semibold">Edit Profile</h2>
              <button onClick={() => setIsProfileOpen(false)} className="text-pigeon-text-secondary hover:text-pigeon-text"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div><label className="block text-sm text-pigeon-text-secondary mb-1">Display Name</label><input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Your name" className="w-full px-3 py-2 bg-pigeon-surface rounded text-pigeon-text placeholder-pigeon-text-muted" /></div>
              <div><label className="block text-sm text-pigeon-text-secondary mb-1">About</label><textarea value={profileAbout} onChange={(e) => setProfileAbout(e.target.value)} placeholder="Tell us about yourself" className="w-full px-3 py-2 bg-pigeon-surface rounded text-pigeon-text placeholder-pigeon-text-muted h-24 resize-none" /></div>
              <div><label className="block text-sm text-pigeon-text-secondary mb-1">Profile Picture URL</label><input type="text" value={profilePicture} onChange={(e) => setProfilePicture(e.target.value)} placeholder="https://example.com/avatar.jpg" className="w-full px-3 py-2 bg-pigeon-surface rounded text-pigeon-text placeholder-pigeon-text-muted" /></div>
              <div><label className="flex items-center gap-2 text-sm text-pigeon-text-secondary mb-1"><Shield className="w-4 h-4" /> NIP-05 Identifier</label><input type="text" value={profileNip05} onChange={(e) => setProfileNip05(e.target.value)} placeholder="you@yourdomain.com" className="w-full px-3 py-2 bg-pigeon-surface rounded text-pigeon-text placeholder-pigeon-text-muted" /><p className="text-xs text-pigeon-text-muted mt-1">Verify your identity with a domain you control</p></div>
            </div>
            <div className="flex justify-end gap-3 p-4">
              <button onClick={() => setIsProfileOpen(false)} className="px-4 py-2 text-pigeon-text-secondary hover:bg-white/10 rounded">Cancel</button>
              <button onClick={handleSaveProfile} className="px-4 py-2 bg-pigeon-primary text-pigeon-text rounded hover:bg-pigeon-primary-dark">Save Profile</button>
            </div>
          </div>
        </div>
      )}

      {/* Key Backup Modal */}
      {isKeyBackupOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsKeyBackupOpen(false)}>
          <div className="bg-gray-800 rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4">
              <h2 className="text-pigeon-text font-semibold">Backup Your Keys</h2>
              <button onClick={() => setIsKeyBackupOpen(false)} className="text-pigeon-text-secondary hover:text-pigeon-text"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="p-4 bg-yellow-900/50 rounded-md"><div className="flex items-center gap-2 text-yellow-200 font-bold"><Key className="w-4 h-4" /> Important!</div><p className="text-yellow-100 text-sm mt-2">Your private key (nsec) is the only way to access your Nostr identity. Keep it secure and never share it with anyone.</p></div>
              <div className="text-center p-4 bg-white rounded-md">{qrCodeUrl && <img src={qrCodeUrl} alt="Key QR Code" className="mx-auto" />}<p className="text-pigeon-text-muted text-xs mt-2">Scan this QR code to import your key into another Nostr app</p></div>
              <div><label className="flex items-center gap-2 text-sm text-pigeon-text-secondary mb-1"><Globe className="w-4 h-4" /> Public Key (npub) - Share this!</label><div className="flex gap-2"><input type="text" value={identity?.npub || ''} readOnly className="flex-1 px-3 py-2 bg-pigeon-surface rounded text-pigeon-text font-mono text-xs" /><button onClick={() => copyKey('npub')} className={`p-2 rounded ${copiedKey === 'npub' ? 'bg-pigeon-success text-pigeon-text' : 'bg-pigeon-surface-light text-pigeon-text-secondary hover:bg-pigeon-surface-light'}`}>{copiedKey === 'npub' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}</button></div></div>
              <div><label className="flex items-center gap-2 text-sm text-pigeon-text-secondary mb-1"><Lock className="w-4 h-4 text-pigeon-danger" /> Private Key (nsec) - KEEP SECRET!</label><div className="flex gap-2"><input type="password" value={identity?.nsec || ''} readOnly className="flex-1 px-3 py-2 bg-pigeon-surface rounded text-pigeon-text font-mono text-xs" /><button onClick={() => copyKey('nsec')} className={`p-2 rounded ${copiedKey === 'nsec' ? 'bg-pigeon-success text-pigeon-text' : 'bg-pigeon-surface-light text-pigeon-text-secondary hover:bg-pigeon-surface-light'}`}>{copiedKey === 'nsec' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}</button></div></div>
            </div>
            <div className="flex justify-end p-4">
              <button onClick={exportKeys} className="flex items-center gap-2 px-4 py-2 bg-pigeon-primary text-pigeon-text rounded hover:bg-pigeon-primary-dark"><Download className="w-4 h-4" /> Export to File</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal - Same as ContactsPage */}
      {isAddContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setIsAddContactOpen(false); resetContactForm(); }} />
          <div className="relative w-full max-w-md p-6 rounded-lg bg-gray-800 animate-scale-in">
            <button 
              onClick={() => { setIsAddContactOpen(false); resetContactForm(); }} 
              className="absolute top-4 right-4 p-1 text-pigeon-text-secondary hover:text-pigeon-text"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-semibold text-pigeon-text mb-4">Add Contact</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-pigeon-text mb-1">
                  <Key className="inline w-4 h-4 mr-1" />
                  Nostr Public Key (npub) *
                </label>
                <input
                  type="text"
                  value={formNpub}
                  onChange={(e) => setFormNpub(e.target.value)}
                  placeholder="npub1..."
                  className="input-premium w-full font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-pigeon-text mb-1">
                  <User className="inline w-4 h-4 mr-1" />
                  Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contact name"
                  className="input-premium w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-pigeon-text mb-1">
                  <Mail className="inline w-4 h-4 mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="input-premium w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-pigeon-text mb-1">
                  <Phone className="inline w-4 h-4 mr-1" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="input-premium w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-pigeon-text mb-1">
                  <FileText className="inline w-4 h-4 mr-1" />
                  Notes
                </label>
                <textarea
                  value={formDetails}
                  onChange={(e) => setFormDetails(e.target.value)}
                  placeholder="Additional details..."
                  rows={3}
                  className="input-premium w-full resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={() => { setIsAddContactOpen(false); resetContactForm(); }} variant="secondary" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSaveContactToStorage} className="flex-1">
                  <Save className="w-4 h-4" />
                  Add Contact
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Channel Modal */}
      {isNewChannelOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsNewChannelOpen(false)}>
          <div className="bg-gray-800 rounded-lg w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4">
              <h2 className="text-pigeon-text font-semibold">Create Channel</h2>
              <button onClick={() => setIsNewChannelOpen(false)} className="text-pigeon-text-secondary hover:text-pigeon-text"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div><label className="block text-sm text-pigeon-text-secondary mb-1">Channel Name <span className="text-pigeon-danger">*</span></label><input type="text" value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)} placeholder="my-channel" className="w-full px-3 py-2 bg-pigeon-surface rounded text-pigeon-text placeholder-pigeon-text-muted" /></div>
              <div><label className="block text-sm text-pigeon-text-secondary mb-1">Description</label><textarea value={newChannelAbout} onChange={(e) => setNewChannelAbout(e.target.value)} placeholder="What's this channel about?" className="w-full px-3 py-2 bg-pigeon-surface rounded text-pigeon-text placeholder-pigeon-text-muted h-24 resize-none" /></div>
            </div>
            <div className="flex justify-end gap-3 p-4">
              <button onClick={() => setIsNewChannelOpen(false)} className="px-4 py-2 text-pigeon-text-secondary hover:bg-white/10 rounded">Cancel</button>
              <button onClick={handleCreateChannel} className="px-4 py-2 bg-pigeon-primary text-pigeon-text rounded hover:bg-pigeon-primary-dark">Create Channel</button>
            </div>
          </div>
        </div>
      )}

      {/* Join Channel Modal */}
      {isJoinChannelOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsJoinChannelOpen(false)}>
          <div className="bg-gray-800 rounded-lg w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4">
              <h2 className="text-pigeon-text font-semibold">Join Channel</h2>
              <button onClick={() => setIsJoinChannelOpen(false)} className="text-pigeon-text-secondary hover:text-pigeon-text"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div><label className="block text-sm text-pigeon-text-secondary mb-1">Channel ID</label><input type="text" value={joinChannelId} onChange={(e) => setJoinChannelId(e.target.value)} placeholder="Enter channel ID (64 hex characters)" className="w-full px-3 py-2 bg-pigeon-surface rounded text-pigeon-text placeholder-pigeon-text-muted font-mono text-sm" /></div>
              <p className="text-xs text-pigeon-text-muted">Get the channel ID from someone who created or is a member of the channel.</p>
            </div>
            <div className="flex justify-end gap-3 p-4">
              <button onClick={() => setIsJoinChannelOpen(false)} className="px-4 py-2 text-pigeon-text-secondary hover:bg-white/10 rounded">Cancel</button>
              <button onClick={handleJoinChannel} className="px-4 py-2 bg-pigeon-primary text-pigeon-text rounded hover:bg-pigeon-primary-dark">Join Channel</button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-full max-h-full" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="w-8 h-8" />
            </button>
            <img 
              src={lightboxImage.src} 
              alt={lightboxImage.name} 
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <p className="text-center text-white mt-2">{lightboxImage.name}</p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default NostrChatPage;
