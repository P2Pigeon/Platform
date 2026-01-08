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
 * Shared component for Nostr keys required screen
 * Used in ContactsPage and NostrChatPage when user is a guest
 */
import React, { useState } from 'react';
import { Key, Lock, Globe, Copy, Check, Shield, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface NostrKeysRequiredProps {
  onCreateIdentity: () => Promise<{ npub: string; nsec: string }>;
  onImportKey: (key: string) => Promise<unknown>;
}

const NostrKeysRequired: React.FC<NostrKeysRequiredProps> = ({ onCreateIdentity, onImportKey }) => {
  const [authMode, setAuthMode] = useState<'choice' | 'create' | 'import'>('choice');
  const [importKeyInput, setImportKeyInput] = useState('');
  const [newKeys, setNewKeys] = useState<{ npub: string; nsec: string } | null>(null);
  const [isCreatingKeys, setIsCreatingKeys] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [hasCopiedNsec, setHasCopiedNsec] = useState(false);
  const [hasCopiedNpub, setHasCopiedNpub] = useState(false);

  const handleGenerateKeys = async () => {
    setIsCreatingKeys(true);
    setAuthError(null);
    try {
      const newIdentity = await onCreateIdentity();
      setNewKeys({ npub: newIdentity.npub, nsec: newIdentity.nsec });
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Failed to generate keys');
    } finally {
      setIsCreatingKeys(false);
    }
  };

  const handleImportKey = async () => {
    if (!importKeyInput.trim()) return;
    setAuthError(null);
    try {
      await onImportKey(importKeyInput.trim());
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Invalid key format');
    }
  };

  const handleCopyNewKey = async (type: 'npub' | 'nsec') => {
    const key = type === 'npub' ? newKeys?.npub : newKeys?.nsec;
    if (key) {
      await navigator.clipboard.writeText(key);
      if (type === 'npub') {
        setHasCopiedNpub(true);
        setTimeout(() => setHasCopiedNpub(false), 2000);
      } else {
        setHasCopiedNsec(true);
        setTimeout(() => setHasCopiedNsec(false), 2000);
      }
    }
  };

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="max-w-md p-8 rounded-lg bg-gray-800 animate-scale-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
            <Key className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {authMode === 'choice' ? 'Nostr Keys Required' : authMode === 'create' ? 'Create New Keys' : 'Import Keys'}
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            {authMode === 'choice' 
              ? 'Your keys are your identity on the decentralized Nostr network.'
              : authMode === 'create'
              ? 'Generate a new cryptographic identity.'
              : 'Enter your existing Nostr private key.'}
          </p>
        </div>

        {/* Error */}
        {authError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">
            {authError}
          </div>
        )}

        {/* Choice Mode */}
        {authMode === 'choice' && (
          <div className="space-y-3">
            <Button onClick={handleGenerateKeys} disabled={isCreatingKeys} size="lg" className="w-full">
              {isCreatingKeys ? <Loader2 className="w-5 h-5 animate-spin" /> : <Key className="w-5 h-5" />}
              {isCreatingKeys ? 'Creating...' : 'Create New Keys'}
            </Button>
            <Button onClick={() => setAuthMode('import')} variant="secondary" size="lg" className="w-full">
              Import Existing Keys
            </Button>
          </div>
        )}

        {/* Show Generated Keys */}
        {newKeys && (
          <div className="space-y-4">
            {/* Public Key */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-gray-300">Public Key (npub)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400">Share this</span>
              </div>
              <div className="flex">
                <input 
                  type="text" 
                  readOnly 
                  value={newKeys.npub} 
                  className="flex-1 px-3 py-2.5 bg-white/5 rounded-l-lg text-gray-300 font-mono text-xs focus:outline-none" 
                />
                <button 
                  onClick={() => handleCopyNewKey('npub')} 
                  className={`px-4 rounded-r-lg transition-all ${hasCopiedNpub ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                >
                  {hasCopiedNpub ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Private Key */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-gray-300">Private Key (nsec)</span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">Keep secret</span>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400 text-sm">
                ⚠️ Save this key securely! It cannot be recovered if lost.
              </div>
              <div className="flex">
                <input 
                  type="text" 
                  readOnly 
                  value={newKeys.nsec} 
                  className="flex-1 px-3 py-2.5 bg-white/5 rounded-l-lg text-gray-300 font-mono text-xs focus:outline-none" 
                />
                <button 
                  onClick={() => handleCopyNewKey('nsec')} 
                  className={`px-4 rounded-r-lg transition-all ${hasCopiedNsec ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-400 hover:text-white'}`}
                >
                  {hasCopiedNsec ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Keys saved automatically. You're ready to go!
            </p>
          </div>
        )}

        {/* Import Mode */}
        {authMode === 'import' && (
          <div className="space-y-4">
            <textarea
              value={importKeyInput}
              onChange={(e) => setImportKeyInput(e.target.value)}
              placeholder="nsec1... or hex private key"
              className="w-full px-4 py-3 bg-white/5 rounded-lg text-white placeholder-gray-500 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/50 min-h-[80px]"
            />
            <Button onClick={handleImportKey} disabled={!importKeyInput.trim()} size="lg" className="w-full">
              Import & Continue
            </Button>
            <Button onClick={() => { setAuthMode('choice'); setImportKeyInput(''); setAuthError(null); }} variant="ghost" className="w-full">
              ← Back
            </Button>
          </div>
        )}

        {/* Footer */}
        <p className="text-sm text-gray-500 mt-6 flex items-center justify-center gap-2">
          <Shield className="w-4 h-4" />
          Keys stored locally, never sent to servers
        </p>
      </div>
    </div>
  );
};

export default NostrKeysRequired;
