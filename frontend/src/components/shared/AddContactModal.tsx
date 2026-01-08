/**
 * P2Pigeon - Secure P2P Communication Platform
 * 
 * @license AGPL-3.0 - https://opensource.org/licenses/AGPL-3.0
 * @copyright 2024-2026 P2Pigeon Contributors
 * @see https://github.com/p2pigeon/platform
 * 
 * Reusable Add Contact Modal Component
 */
import React, { useState, useEffect } from 'react';
import { X, Key, User, Mail, Phone, FileText, Save } from 'lucide-react';
import { Button } from '../ui/button';

export interface ContactFormData {
  npub: string;
  name: string;
  email?: string;
  phone?: string;
  details?: string;
}

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ContactFormData) => void;
  editingContact?: ContactFormData | null;
  title?: string;
}

const AddContactModal: React.FC<AddContactModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingContact = null,
  title
}) => {
  const [formNpub, setFormNpub] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDetails, setFormDetails] = useState('');

  // Reset form when modal opens/closes or editing contact changes
  useEffect(() => {
    if (isOpen && editingContact) {
      setFormNpub(editingContact.npub || '');
      setFormName(editingContact.name || '');
      setFormEmail(editingContact.email || '');
      setFormPhone(editingContact.phone || '');
      setFormDetails(editingContact.details || '');
    } else if (!isOpen) {
      setFormNpub('');
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormDetails('');
    }
  }, [isOpen, editingContact]);

  const handleSave = () => {
    if (!formNpub.trim() || !formName.trim()) return;
    
    onSave({
      npub: formNpub.trim(),
      name: formName.trim(),
      email: formEmail.trim() || undefined,
      phone: formPhone.trim() || undefined,
      details: formDetails.trim() || undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md p-6 rounded-lg bg-gray-800 animate-scale-in">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-1 text-pigeon-text-secondary hover:text-pigeon-text"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold text-pigeon-text mb-4">
          {title || (editingContact ? 'Edit Contact' : 'Add Contact')}
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
              className="w-full px-3 py-2 bg-pigeon-surface rounded text-pigeon-text placeholder-pigeon-text-muted font-mono text-sm focus:outline-none focus:ring-2 focus:ring-pigeon-primary/50"
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
              className="w-full px-3 py-2 bg-pigeon-surface rounded text-pigeon-text placeholder-pigeon-text-muted focus:outline-none focus:ring-2 focus:ring-pigeon-primary/50"
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
              className="w-full px-3 py-2 bg-pigeon-surface rounded text-pigeon-text placeholder-pigeon-text-muted focus:outline-none focus:ring-2 focus:ring-pigeon-primary/50"
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
              className="w-full px-3 py-2 bg-pigeon-surface rounded text-pigeon-text placeholder-pigeon-text-muted focus:outline-none focus:ring-2 focus:ring-pigeon-primary/50"
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
              className="w-full px-3 py-2 bg-pigeon-surface rounded text-pigeon-text placeholder-pigeon-text-muted resize-none focus:outline-none focus:ring-2 focus:ring-pigeon-primary/50"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={onClose} variant="secondary" className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1" disabled={!formNpub.trim() || !formName.trim()}>
              <Save className="w-4 h-4" />
              {editingContact ? 'Update' : 'Add Contact'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddContactModal;
