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
 * @file Settings.tsx
 * @description Simplified P2Pigeon settings page with premium design
 */
import React, { useState } from 'react';
import { Shield, Key, Copy, Check, LogOut, Download, User, Globe, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';

const Settings: React.FC = () => {
  const { identity, signOut } = useAuth();
  const [copiedKey, setCopiedKey] = useState<'nsec' | 'npub' | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const copyKey = async (type: 'nsec' | 'npub') => {
    const key = type === 'nsec' ? identity?.nsec : identity?.npub;
    if (key) {
      await navigator.clipboard.writeText(key);
      setCopiedKey(type);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const exportKeys = () => {
    if (!identity) return;
    const keyData = {
      npub: identity.npub,
      nsec: identity.nsec,
      publicKey: identity.publicKey,
      exportedAt: new Date().toISOString(),
      warning: 'KEEP THIS FILE SECURE! Anyone with your nsec can access your identity.',
    };
    const blob = new Blob([JSON.stringify(keyData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `p2pigeon-keys-${identity.npub.slice(0, 12)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const truncateKey = (key: string) => `${key.slice(0, 16)}...${key.slice(-8)}`;

  return (
    <div className="min-h-full p-6 md:p-8 lg:p-10">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-pigeon-text mb-2">Settings</h1>
          <p className="text-pigeon-text-secondary">Manage your identity and security</p>
        </div>

        {/* Identity Card */}
        <div className="p-6 rounded-lg bg-gray-800 animate-slide-up">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-pigeon-text">Your Identity</h2>
              <p className="text-pigeon-text-secondary text-sm">Nostr cryptographic keys</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Public Key */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-pigeon-primary" />
                <label className="text-sm font-medium text-pigeon-text">Public Key (npub)</label>
                <span className="badge-primary text-xs">Share freely</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={identity?.npub ? truncateKey(identity.npub) : 'Not available'}
                  className="input-premium flex-1 font-mono text-sm"
                />
                <button
                  onClick={() => copyKey('npub')}
                  disabled={!identity?.npub}
                  className={`btn-icon px-4 rounded-xl border ${
                    copiedKey === 'npub'
                      ? 'bg-pigeon-success/20 text-pigeon-success border-pigeon-success/30'
                      : 'border-pigeon-border hover:bg-white/5'
                  }`}
                >
                  {copiedKey === 'npub' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Private Key */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-pigeon-danger" />
                <label className="text-sm font-medium text-pigeon-text">Private Key (nsec)</label>
                <span className="badge-danger text-xs">Keep secret</span>
              </div>
              <div className="flex gap-2">
                <input
                  type={showPrivateKey ? 'text' : 'password'}
                  readOnly
                  value={identity?.nsec ? (showPrivateKey ? truncateKey(identity.nsec) : '••••••••••••••••••••') : 'Not available'}
                  className="input-premium flex-1 font-mono text-sm"
                />
                <button
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="btn-icon px-4 rounded-xl border border-pigeon-border hover:bg-white/5"
                >
                  {showPrivateKey ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={() => copyKey('nsec')}
                  disabled={!identity?.nsec}
                  className={`btn-icon px-4 rounded-xl border ${
                    copiedKey === 'nsec'
                      ? 'bg-pigeon-success/20 text-pigeon-success border-pigeon-success/30'
                      : 'border-pigeon-border hover:bg-white/5'
                  }`}
                >
                  {copiedKey === 'nsec' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="divider my-6" />

          <Button onClick={exportKeys} disabled={!identity} variant="secondary" className="w-full">
            <Download className="w-5 h-5" />
            Export Keys to File
          </Button>
        </div>

        {/* Security Info */}
        <div className="p-6 rounded-lg bg-gray-800 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-pigeon-success/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-pigeon-success" />
            </div>
            <div>
              <h3 className="font-semibold text-pigeon-text">Security Status</h3>
              <p className="text-pigeon-text-secondary text-sm">All communications protected</p>
            </div>
            <div className="ml-auto badge-success">Active</div>
          </div>
          <ul className="space-y-2 text-sm text-pigeon-text-secondary">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-pigeon-success" />
              End-to-end encryption enabled
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-pigeon-success" />
              Keys stored locally only
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-pigeon-success" />
              Zero-knowledge architecture
            </li>
          </ul>
        </div>

        {/* Warning */}
        <div className="p-4 rounded-lg bg-amber-500/10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-pigeon-accent flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-pigeon-accent">Important</p>
              <p className="text-pigeon-text-secondary mt-1">
                Your private key cannot be recovered if lost. Make sure to back it up securely.
              </p>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <Button onClick={signOut} variant="destructive" size="lg" className="w-full animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <LogOut className="w-5 h-5" />
          Sign Out
        </Button>

        {/* Version */}
        <p className="text-center text-pigeon-text-muted text-sm animate-fade-in">
          P2Pigeon v1.0.0
        </p>
      </div>
    </div>
  );
};

export default Settings;
