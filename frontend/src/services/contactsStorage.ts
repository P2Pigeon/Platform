/**
 * P2Pigeon - Secure P2P Communication Platform
 * 
 * Shared Contacts Storage Service
 * Used by both ContactsPage and NostrChatPage to persist contacts to localStorage
 */

export interface StoredContact {
  id: string;
  npub: string;
  name: string;
  email?: string;
  phone?: string;
  details?: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'pigeon_contacts_encrypted';

// Simple XOR encryption using the user's pubkey as key
export const encryptContacts = (data: string, key: string): string => {
  const keyBytes = key.split('').map(c => c.charCodeAt(0));
  const dataBytes = data.split('').map(c => c.charCodeAt(0));
  const encrypted = dataBytes.map((byte, i) => byte ^ keyBytes[i % keyBytes.length]);
  return btoa(String.fromCharCode(...encrypted));
};

export const decryptContacts = (data: string, key: string): string => {
  try {
    const keyBytes = key.split('').map(c => c.charCodeAt(0));
    const encryptedBytes = atob(data).split('').map(c => c.charCodeAt(0));
    const decrypted = encryptedBytes.map((byte, i) => byte ^ keyBytes[i % keyBytes.length]);
    return String.fromCharCode(...decrypted);
  } catch {
    return '';
  }
};

// Load contacts from localStorage
export const loadContacts = (publicKey: string): StoredContact[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const decrypted = decryptContacts(stored, publicKey);
      if (decrypted) {
        const parsed = JSON.parse(decrypted);
        // Validate it's an array
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.error('Failed to load contacts:', err);
    // Clear corrupted data
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('Cleared corrupted contacts data');
    } catch {}
  }
  return [];
};

// Save contacts to localStorage
export const saveContacts = (contacts: StoredContact[], publicKey: string): void => {
  try {
    const encrypted = encryptContacts(JSON.stringify(contacts), publicKey);
    localStorage.setItem(STORAGE_KEY, encrypted);
  } catch (err) {
    console.error('Failed to save contacts:', err);
  }
};

// Add a single contact
export const addContact = (contact: Omit<StoredContact, 'id' | 'createdAt' | 'updatedAt'>, publicKey: string): StoredContact | null => {
  const contacts = loadContacts(publicKey);
  
  // Check for duplicate npub
  if (contacts.some(c => c.npub === contact.npub)) {
    return null; // Duplicate
  }
  
  const now = Date.now();
  const newContact: StoredContact = {
    id: `${now}-${Math.random().toString(36).slice(2, 9)}`,
    ...contact,
    createdAt: now,
    updatedAt: now
  };
  
  saveContacts([...contacts, newContact], publicKey);
  return newContact;
};

// Find contact by npub
export const findContactByNpub = (npub: string, publicKey: string): StoredContact | undefined => {
  const contacts = loadContacts(publicKey);
  return contacts.find(c => c.npub === npub);
};

// Search contacts
export const searchContacts = (query: string, publicKey: string): StoredContact[] => {
  const contacts = loadContacts(publicKey);
  if (!query.trim()) return contacts;
  
  const q = query.toLowerCase();
  return contacts.filter(c => 
    c.name.toLowerCase().includes(q) ||
    c.npub.toLowerCase().includes(q) ||
    c.email?.toLowerCase().includes(q) ||
    c.phone?.includes(q)
  );
};
