/**
 * P2Pigeon - Secure P2P Communication Platform
 * 
 * @license AGPL-3.0 - https://opensource.org/licenses/AGPL-3.0
 * @copyright 2024-2026 P2Pigeon Contributors
 * @see https://github.com/p2pigeon/platform
 * 
 * Last updated: 2026-01-07
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { X, Copy, Check, Key, Shield, Sparkles, AlertTriangle, Globe, ArrowRight, User } from 'lucide-react';
import { Button } from './ui/button';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, mode }) => {
  const { createIdentity, signInWithPrivateKey, signInAsGuest } = useAuth();
  const navigate = useNavigate();
  const [loginKey, setLoginKey] = useState('');
  const [newNsec, setNewNsec] = useState('');
  const [newNpub, setNewNpub] = useState('');
  const [hasCopiedNsec, setHasCopiedNsec] = useState(false);
  const [hasCopiedNpub, setHasCopiedNpub] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showImportForm, setShowImportForm] = useState(false);
  const [importKey, setImportKey] = useState('');

  const handleCopyNsec = async () => {
    await navigator.clipboard.writeText(newNsec);
    setHasCopiedNsec(true);
    setTimeout(() => setHasCopiedNsec(false), 2000);
  };

  const handleCopyNpub = async () => {
    await navigator.clipboard.writeText(newNpub);
    setHasCopiedNpub(true);
    setTimeout(() => setHasCopiedNpub(false), 2000);
  };

  const handleLogin = async () => {
    if (loginKey) {
      try {
        setLoginError('');
        await signInWithPrivateKey(loginKey);
        navigate('/app');
      } catch (error) {
        console.error("Login failed", error);
        setLoginError(error instanceof Error ? error.message : 'Invalid key format');
      }
    }
  };

  const handleGenerateAndSignUp = async () => {
    try {
      const newIdentity = await createIdentity();
      setNewNsec(newIdentity.nsec);
      setNewNpub(newIdentity.npub);
    } catch (error) {
      console.error("Sign up failed", error);
    }
  };

  const handleProceedToApp = async () => {
    await signInAsGuest();
    navigate('/app');
  };

  const handleKeysConfirmed = () => {
    navigate('/app');
  };

  const handleImportKey = async () => {
    if (importKey) {
      try {
        setLoginError('');
        await signInWithPrivateKey(importKey);
        navigate('/app');
      } catch (error) {
        console.error("Import failed", error);
        setLoginError(error instanceof Error ? error.message : 'Invalid key format');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md bg-gray-800 rounded-lg overflow-hidden animate-scale-in" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              {newNsec ? 'Keys Generated' : mode === 'login' ? 'Welcome Back' : 'Create Identity'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {mode === 'login' ? (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                Enter your private key to access your identity.
              </p>
              <textarea
                className="w-full px-4 py-3 bg-white/5 rounded-xl text-white placeholder-gray-500 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/50 min-h-[100px]"
                placeholder="nsec1... or hex private key"
                value={loginKey}
                onChange={(e) => setLoginKey(e.target.value)}
              />
              {loginError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {loginError}
                </div>
              )}
              <Button onClick={handleLogin} disabled={!loginKey} size="lg" className="w-full">
                <Key className="w-4 h-4" />
                Sign In
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {!newNsec && !showImportForm ? (
                <>
                  <p className="text-gray-400 text-sm">
                    Generate a new cryptographic identity for the Nostr network. 
                    This creates your unique key pair.
                  </p>
                  <Button onClick={handleGenerateAndSignUp} size="lg" className="w-full">
                    <Sparkles className="w-5 h-5" />
                    Generate New Keys
                  </Button>
                  <Button onClick={() => setShowImportForm(true)} variant="secondary" size="lg" className="w-full">
                    <Key className="w-5 h-5" />
                    Import Existing Keys
                  </Button>
                </>
              ) : showImportForm ? (
                <>
                  <Button onClick={() => { setShowImportForm(false); setImportKey(''); setLoginError(''); }} variant="ghost" size="sm" className="mb-2">
                    ← Back
                  </Button>
                  <textarea
                    className="w-full px-4 py-3 bg-white/5 rounded-xl text-white placeholder-gray-500 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/50 min-h-[100px]"
                    placeholder="nsec1... or hex private key"
                    value={importKey}
                    onChange={(e) => setImportKey(e.target.value)}
                  />
                  {loginError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-400 text-sm">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      {loginError}
                    </div>
                  )}
                  <Button onClick={handleImportKey} disabled={!importKey} size="lg" className="w-full">
                    <ArrowRight className="w-4 h-4" />
                    Import & Continue
                  </Button>
                </>
              ) : (
                <>
                  {/* Keys Generated View */}
                  <div className="space-y-4">
                    {/* Public Key */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm text-gray-300">Public Key</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400">Share</span>
                      </div>
                      <div className="flex">
                        <input
                          type="text"
                          readOnly
                          value={newNpub}
                          className="flex-1 px-3 py-2.5 bg-white/5 rounded-l-xl text-gray-300 font-mono text-xs focus:outline-none"
                        />
                        <button
                          onClick={handleCopyNpub}
                          className={`px-4 rounded-r-xl transition-all ${
                            hasCopiedNpub 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : 'bg-white/5 text-gray-400 hover:text-white'
                          }`}
                        >
                          {hasCopiedNpub ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    
                    {/* Private Key */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-amber-400" />
                        <span className="text-sm text-gray-300">Private Key</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">Secret</span>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 text-sm flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Save this key securely. It cannot be recovered.</span>
                      </div>
                      <div className="flex">
                        <input
                          type="text"
                          readOnly
                          value={newNsec}
                          className="flex-1 px-3 py-2.5 bg-white/5 rounded-l-xl text-gray-300 font-mono text-xs focus:outline-none"
                        />
                        <button
                          onClick={handleCopyNsec}
                          className={`px-4 rounded-r-xl transition-all ${
                            hasCopiedNsec 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : 'bg-white/5 text-gray-400 hover:text-white'
                          }`}
                        >
                          {hasCopiedNsec ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <Button onClick={handleKeysConfirmed} size="lg" className="w-full mt-4">
                    <Check className="w-4 h-4" />
                    Keys Saved, Continue
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!newNsec && !showImportForm && (
          <div className="px-6 pb-6">
            <div className="flex items-center gap-3 text-gray-500 text-xs mb-4">
              <div className="flex-1 h-px bg-white/10" />
              <span>or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <Button onClick={handleProceedToApp} variant="ghost" className="w-full">
              <User className="w-4 h-4" />
              Continue as Guest
            </Button>
            <p className="text-center text-gray-600 text-xs mt-3">
              <Shield className="w-3 h-3 inline mr-1" />
              Keys are stored locally and never leave your device
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
