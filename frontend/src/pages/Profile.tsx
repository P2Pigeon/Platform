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
 * Profile Page Component
 * 
 * Allows users to manage their identity and profile settings
 */
import React, { useState, useEffect } from 'react';
import { Copy, Check, Key, User, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FormInput from '../components/forms/FormInput';
import { ValidationResult, isValidEmail, minLength, compose } from '../utils/validation';

const Profile: React.FC = () => {
  const { identity, publicIdentity, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState<string>(identity?.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(identity?.avatar || '');
  const [email, setEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ displayName?: string; avatarUrl?: string; email?: string }>({});
  const [showPrivateKey, setShowPrivateKey] = useState<boolean>(false);
  const [hasIdCopied, setHasIdCopied] = useState(false);
  const [hasPublicKeyCopied, setHasPublicKeyCopied] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  useEffect(() => {
    if (identity) {
      setDisplayName(identity.displayName || '');
      setAvatarUrl(identity.avatar || '');
    }
  }, [identity]);

  const validateForm = (): boolean => {
    const newErrors: { displayName?: string; avatarUrl?: string; email?: string } = {};
    if (displayName.trim()) {
      const displayNameValidation: ValidationResult = compose(minLength(displayName, 2));
      if (!displayNameValidation.isValid) newErrors.displayName = displayNameValidation.errorMessage;
    }
    if (email.trim()) {
      const emailValidation = isValidEmail(email);
      if (!emailValidation.isValid) newErrors.email = emailValidation.errorMessage;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await updateProfile({ displayName: displayName.trim() || undefined, avatar: avatarUrl.trim() || undefined });
      setNotification({ type: 'success', message: 'Your profile information has been updated successfully' });
    } catch (error) {
      setNotification({ type: 'error', message: error instanceof Error ? error.message : 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const truncateString = (str: string, startLength = 6, endLength = 4): string => {
    if (!str || str.length <= startLength + endLength) return str;
    return `${str.substring(0, startLength)}...${str.substring(str.length - endLength)}`;
  };

  const copyToClipboard = (text: string, type: 'id' | 'publicKey') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') { setHasIdCopied(true); setTimeout(() => setHasIdCopied(false), 2000); }
    else { setHasPublicKeyCopied(true); setTimeout(() => setHasPublicKeyCopied(false), 2000); }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
        <p className="text-gray-400">Manage your identity and profile settings. Your cryptographic identity is used for secure peer-to-peer communication.</p>
      </div>

      {notification && (
        <div className={`p-4 rounded-md ${notification.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>{notification.message}</div>
      )}
      
      {/* Identity Card */}
      <div className="bg-gray-800 border border-gray-700 rounded-md shadow-md">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Key className="w-5 h-5" /> Cryptographic Identity</h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-cyan-600 flex items-center justify-center text-white text-xl font-bold">
              {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" /> : (displayName || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                {displayName || 'Anonymous User'}
                <span className={`px-2 py-0.5 text-xs rounded-full ${publicIdentity?.id ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {publicIdentity?.id ? 'Verified' : 'Unverified'}
                </span>
              </h3>
              <p className="text-sm text-gray-400">Created {identity?.createdAt ? new Date(identity.createdAt).toLocaleDateString() : 'Unknown'}</p>
            </div>
          </div>
          
          <hr className="border-gray-700" />
          
          <div>
            <p className="font-semibold text-gray-300 mb-1">Identity ID</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-gray-900 rounded-md text-sm text-gray-300">{publicIdentity?.id ? truncateString(publicIdentity.id, 10, 6) : 'Not available'}</code>
              <button title={hasIdCopied ? 'Copied!' : 'Copy ID'} onClick={() => publicIdentity?.id && copyToClipboard(publicIdentity.id, 'id')} className="p-2 text-gray-400 hover:text-white">
                {hasIdCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div>
            <p className="font-semibold text-gray-300 mb-1">Public Key</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-gray-900 rounded-md text-sm text-gray-300">{publicIdentity?.publicKey ? truncateString(publicIdentity.publicKey, 10, 6) : 'Not available'}</code>
              <button title={hasPublicKeyCopied ? 'Copied!' : 'Copy Public Key'} onClick={() => publicIdentity?.publicKey && copyToClipboard(publicIdentity.publicKey, 'publicKey')} className="p-2 text-gray-400 hover:text-white">
                {hasPublicKeyCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="font-semibold text-gray-300">Private Key</p>
              <button onClick={() => setShowPrivateKey(!showPrivateKey)} className={`w-10 h-5 rounded-full transition-colors ${showPrivateKey ? 'bg-cyan-600' : 'bg-gray-600'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${showPrivateKey ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {showPrivateKey ? (
              <code className="block p-2 bg-gray-900 rounded-md text-sm text-gray-300">{identity?.privateKey ? truncateString(identity.privateKey, 15, 8) : 'Not available'}</code>
            ) : (
              <p className="p-2 text-sm text-gray-500 italic">Hidden for security. Toggle switch to reveal.</p>
            )}
          </div>
          
          <div className="p-3 bg-yellow-900/30 rounded-md flex items-start gap-3">
            <Shield className="w-6 h-6 text-yellow-400 flex-shrink-0" />
            <p className="text-sm text-yellow-300">Your private key is stored locally and never transmitted. Keep it secure and don't share it with anyone.</p>
          </div>
        </div>
      </div>
      
      {/* Profile Edit Form */}
      <div className="bg-gray-800 border border-gray-700 rounded-md shadow-md">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2"><User className="w-5 h-5" /> Profile Information</h2>
        </div>
        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput id="displayName" name="displayName" label="Display Name" value={displayName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)} error={errors.displayName} helpText="This name will be visible to other users" />
            <FormInput id="avatarUrl" name="avatarUrl" label="Avatar URL" value={avatarUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAvatarUrl(e.target.value)} error={errors.avatarUrl} helpText="URL to an image that will be used as your avatar" />
            <FormInput id="email" name="email" type="email" label="Email (Optional)" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} error={errors.email} helpText="Only used for notifications, never shared with other users" />
            <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50 mt-4">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating</> : 'Update Profile'}
            </button>
          </form>
        </div>
        <div className="p-4 border-t border-gray-700">
          <p className="text-sm text-gray-400">Profile information is shared only with peers you connect to directly.</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
