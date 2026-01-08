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
 * Contacts Page - Store contacts by Nostr pubkey with encrypted local storage
 * Requires authentication (not guest mode)
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, Search, Edit2, Trash2, Download, Upload, Key, 
  Mail, Phone, FileText, User, Home, X, Save, AlertCircle,
  Lock, Copy, Check
} from 'lucide-react';
import { useAuth, AuthStatus } from '../context/AuthContext';
import NostrKeysRequired from '../components/NostrKeysRequired';
import { Button } from '../components/ui/button';

interface Contact {
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

const ContactsPage: React.FC = () => {
  const navigate = useNavigate();
  const { identity, status: authStatus, createIdentity, signInWithPrivateKey } = useAuth();
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Form state
  const [formNpub, setFormNpub] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDetails, setFormDetails] = useState('');

  const isGuest = authStatus === AuthStatus.GUEST || !identity;

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Simple XOR encryption using the user's pubkey as key
  const encrypt = (data: string, key: string): string => {
    const keyBytes = key.split('').map(c => c.charCodeAt(0));
    const dataBytes = data.split('').map(c => c.charCodeAt(0));
    const encrypted = dataBytes.map((byte, i) => byte ^ keyBytes[i % keyBytes.length]);
    return btoa(String.fromCharCode(...encrypted));
  };

  const decrypt = (data: string, key: string): string => {
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
  useEffect(() => {
    if (!identity?.publicKey) return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const decrypted = decrypt(stored, identity.publicKey);
        if (decrypted) {
          const parsed = JSON.parse(decrypted);
          setContacts(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
    }
  }, [identity?.publicKey]);

  // Save contacts to localStorage
  const saveContacts = (newContacts: Contact[]) => {
    if (!identity?.publicKey) return;
    
    try {
      const encrypted = encrypt(JSON.stringify(newContacts), identity.publicKey);
      localStorage.setItem(STORAGE_KEY, encrypted);
      setContacts(newContacts);
    } catch (err) {
      console.error('Failed to save contacts:', err);
      showNotification('error', 'Failed to save contacts');
    }
  };

  // Filter contacts by search
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const query = searchQuery.toLowerCase();
    return contacts.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.npub.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.phone?.includes(query)
    );
  }, [contacts, searchQuery]);

  // Reset form
  const resetForm = () => {
    setFormNpub('');
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormDetails('');
    setEditingContact(null);
  };

  // Open edit modal
  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setFormNpub(contact.npub);
    setFormName(contact.name);
    setFormEmail(contact.email || '');
    setFormPhone(contact.phone || '');
    setFormDetails(contact.details || '');
    setIsAddModalOpen(true);
  };

  // Save contact (add or edit)
  const handleSaveContact = () => {
    const now = Date.now();
    
    if (editingContact) {
      // Update existing
      const updated = contacts.map(c => 
        c.id === editingContact.id 
          ? { ...c, npub: formNpub, name: formName, email: formEmail || undefined, phone: formPhone || undefined, details: formDetails || undefined, updatedAt: now }
          : c
      );
      saveContacts(updated);
      showNotification('success', 'Contact updated');
    } else {
      // Check for duplicate npub
      if (contacts.some(c => c.npub === formNpub)) {
        showNotification('error', 'A contact with this pubkey already exists');
        return;
      }
      
      // Add new
      const newContact: Contact = {
        id: `${now}-${Math.random().toString(36).slice(2, 9)}`,
        npub: formNpub,
        name: formName,
        email: formEmail || undefined,
        phone: formPhone || undefined,
        details: formDetails || undefined,
        createdAt: now,
        updatedAt: now
      };
      saveContacts([...contacts, newContact]);
      showNotification('success', 'Contact added');
    }

    setIsAddModalOpen(false);
    resetForm();
  };

  // Delete contact
  const handleDeleteContact = (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    saveContacts(contacts.filter(c => c.id !== id));
    showNotification('info', 'Contact deleted');
  };

  // Export to CSV
  const handleExport = () => {
    if (contacts.length === 0) {
      showNotification('error', 'No contacts to export');
      return;
    }

    const headers = ['npub', 'name', 'email', 'phone', 'details'];
    const csvRows = [
      headers.join(','),
      ...contacts.map(c => 
        [c.npub, c.name, c.email || '', c.phone || '', c.details || '']
          .map(field => `"${(field || '').replace(/"/g, '""')}"`)
          .join(',')
      )
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pigeon-contacts-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('success', `Exported ${contacts.length} contacts`);
  };

  // Import from CSV
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          showNotification('error', 'Invalid CSV file');
          return;
        }

        // Skip header row
        const dataLines = lines.slice(1);
        const now = Date.now();
        let imported = 0;
        let skipped = 0;

        const newContacts = [...contacts];
        
        dataLines.forEach((line, idx) => {
          // Parse CSV line (handle quoted fields)
          const fields: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              fields.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          fields.push(current.trim());

          const [npub, name, email, phone, details] = fields;
          
          if (!npub || !name) {
            skipped++;
            return;
          }

          // Skip if npub already exists
          if (newContacts.some(c => c.npub === npub)) {
            skipped++;
            return;
          }

          newContacts.push({
            id: `${now}-${idx}-${Math.random().toString(36).slice(2, 9)}`,
            npub,
            name,
            email: email || undefined,
            phone: phone || undefined,
            details: details || undefined,
            createdAt: now,
            updatedAt: now
          });
          imported++;
        });

        saveContacts(newContacts);
        showNotification('success', `Imported ${imported} contacts${skipped > 0 ? `, skipped ${skipped}` : ''}`);
      } catch (err) {
        console.error('Import error:', err);
        showNotification('error', 'Failed to parse CSV file');
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  // Copy npub to clipboard
  const handleCopyNpub = async (npub: string, id: string) => {
    await navigator.clipboard.writeText(npub);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Guest view - require login
  if (isGuest) {
    return (
      <NostrKeysRequired 
        onCreateIdentity={createIdentity}
        onImportKey={signInWithPrivateKey}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-pigeon-bg p-4 md:p-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl backdrop-blur-xl border animate-slide-down ${
          notification.type === 'success' ? 'bg-pigeon-success/20 text-pigeon-success border-pigeon-success/30' : 
          notification.type === 'error' ? 'bg-pigeon-danger/20 text-pigeon-danger border-pigeon-danger/30' : 
          'bg-pigeon-primary/20 text-pigeon-primary border-pigeon-primary/30'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-pigeon-bg-elevated">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/app')} className="p-2 rounded-lg text-pigeon-text-secondary hover:text-pigeon-text hover:bg-white/5">
              <Home className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-pigeon-text">Contacts</h1>
            <span className="badge-primary text-xs">{contacts.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" asChild>
              <label className="cursor-pointer">
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Import</span>
                <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
              </label>
            </Button>
            <Button onClick={handleExport} variant="secondary">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Contact</span>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 bg-pigeon-surface rounded-lg text-pigeon-text placeholder-pigeon-text-muted focus:outline-none focus:ring-2 focus:ring-pigeon-primary/50"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pigeon-text-muted" />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredContacts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <User className="w-16 h-16 text-pigeon-text-muted mb-4" />
            <p className="text-pigeon-text-muted text-lg">
              {searchQuery ? 'No contacts match your search' : 'No contacts yet'}
            </p>
            <p className="text-pigeon-text-muted text-sm mt-1">
              {searchQuery ? 'Try a different search term' : 'Add your first contact to get started'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredContacts.map(contact => (
              <div key={contact.id} className="p-4 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {contact.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-pigeon-text">{contact.name}</h3>
                      <button 
                        onClick={() => handleCopyNpub(contact.npub, contact.id)}
                        className="flex items-center gap-1 text-xs text-pigeon-text-secondary hover:text-pigeon-primary font-mono"
                      >
                        <Key className="w-3 h-3" />
                        {contact.npub.slice(0, 12)}...
                        {copiedId === contact.id ? <Check className="w-3 h-3 text-pigeon-success" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal(contact)} className="p-1.5 text-pigeon-text-secondary hover:text-pigeon-primary hover:bg-white/5 rounded">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteContact(contact.id)} className="p-1.5 text-pigeon-text-secondary hover:text-pigeon-danger hover:bg-white/5 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-1 text-sm">
                  {contact.email && (
                    <div className="flex items-center gap-2 text-pigeon-text-secondary">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-pigeon-text-secondary">
                      <Phone className="w-3 h-3" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  {contact.details && (
                    <div className="flex items-start gap-2 text-pigeon-text-secondary">
                      <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{contact.details}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="p-3 border-t border-white/10 bg-pigeon-bg-elevated">
        <p className="text-xs text-pigeon-text-muted flex items-center justify-center gap-2">
          <Lock className="w-3 h-3" />
          Contacts encrypted with your Nostr public key and stored locally
        </p>
      </div>

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setIsAddModalOpen(false); resetForm(); }} />
          <div className="relative w-full max-w-md p-6 rounded-lg bg-gray-800 animate-scale-in">
            <button 
              onClick={() => { setIsAddModalOpen(false); resetForm(); }} 
              className="absolute top-4 right-4 p-1 text-pigeon-text-secondary hover:text-pigeon-text"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-semibold text-pigeon-text mb-4">
              {editingContact ? 'Edit Contact' : 'Add Contact'}
            </h2>

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
                <Button onClick={() => { setIsAddModalOpen(false); resetForm(); }} variant="secondary" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSaveContact} className="flex-1">
                  <Save className="w-4 h-4" />
                  {editingContact ? 'Update' : 'Add Contact'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsPage;
