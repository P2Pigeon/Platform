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
 * @file SecurityIndicators.tsx
 * @description Security visualization components to display encryption status,
 * connection security levels, and verification indicators.
 */

import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  Shield, 
  UserCheck, 
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  RefreshCw,
  Key,
  X
} from 'lucide-react';

export enum SecurityLevel {
  STANDARD = 'STANDARD',
  ENHANCED = 'ENHANCED',
  MAXIMUM = 'MAXIMUM'
}

export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED'
}

export enum EncryptionStatus {
  NONE = 'NONE',
  TRANSPORT = 'TRANSPORT',
  END_TO_END = 'END_TO_END'
}

interface SecurityBadgeProps {
  level: SecurityLevel;
  size?: 'sm' | 'md' | 'lg';
  withIcon?: boolean;
  tooltipInfo?: string;
}

interface VerificationBadgeProps {
  status: VerificationStatus;
  size?: 'sm' | 'md' | 'lg';
  withIcon?: boolean;
  name?: string;
}

interface EncryptionBadgeProps {
  status: EncryptionStatus;
  size?: 'sm' | 'md' | 'lg';
  withIcon?: boolean;
}

interface ConnectionStatusProps {
  isConnected: boolean;
  quality?: number;
  type?: string;
  info?: string;
}

interface SecuritySummaryProps {
  securityLevel: SecurityLevel;
  encryptionStatus: EncryptionStatus;
  peerVerificationEnabled: boolean;
  verifiedParticipants: number;
  totalParticipants: number;
  connectionStrength: number;
  isDirectConnection: boolean;
}

export const SecurityBadge: React.FC<SecurityBadgeProps> = ({
  level,
  size = 'md',
  withIcon = true,
  tooltipInfo
}) => {
  const config = {
    [SecurityLevel.STANDARD]: { color: 'bg-blue-500/20 text-blue-400', label: 'Standard', Icon: Shield },
    [SecurityLevel.ENHANCED]: { color: 'bg-purple-500/20 text-purple-400', label: 'Enhanced', Icon: Lock },
    [SecurityLevel.MAXIMUM]: { color: 'bg-green-500/20 text-green-400', label: 'Maximum', Icon: Key }
  };
  const { color, label, Icon } = config[level];
  const sizeClass = size === 'sm' ? 'text-xs px-1.5' : size === 'md' ? 'text-sm px-2' : 'text-base px-2 py-1';
  
  return (
    <span title={tooltipInfo} className={`inline-flex items-center gap-1 rounded ${color} ${sizeClass}`}>
      {withIcon && <Icon className="w-3 h-3" />}
      {label}
    </span>
  );
};

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  status,
  size = 'md',
  withIcon = true,
  name
}) => {
  const config = {
    [VerificationStatus.UNVERIFIED]: { color: 'bg-gray-500/20 text-gray-400', label: 'Unverified', Icon: AlertTriangle },
    [VerificationStatus.PENDING]: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Pending', Icon: RefreshCw },
    [VerificationStatus.VERIFIED]: { color: 'bg-green-500/20 text-green-400', label: 'Verified', Icon: UserCheck }
  };
  const { color, label, Icon } = config[status];
  const sizeClass = size === 'sm' ? 'text-xs px-1.5' : size === 'md' ? 'text-sm px-2' : 'text-base px-2 py-1';
  
  return (
    <span title={`${name ? name + ' is ' : ''}${label}`} className={`inline-flex items-center gap-1 rounded ${color} ${sizeClass}`}>
      {withIcon && <Icon className="w-3 h-3" />}
      {label}
    </span>
  );
};

export const EncryptionBadge: React.FC<EncryptionBadgeProps> = ({
  status,
  size = 'md',
  withIcon = true
}) => {
  const config = {
    [EncryptionStatus.NONE]: { color: 'bg-red-500/20 text-red-400', label: 'Not Encrypted', Icon: Unlock },
    [EncryptionStatus.TRANSPORT]: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Transport Encrypted', Icon: Shield },
    [EncryptionStatus.END_TO_END]: { color: 'bg-green-500/20 text-green-400', label: 'E2E Encrypted', Icon: Lock }
  };
  const { color, label, Icon } = config[status];
  const sizeClass = size === 'sm' ? 'text-xs px-1.5' : size === 'md' ? 'text-sm px-2' : 'text-base px-2 py-1';
  
  return (
    <span className={`inline-flex items-center gap-1 rounded ${color} ${sizeClass}`}>
      {withIcon && <Icon className="w-3 h-3" />}
      {label}
    </span>
  );
};

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  quality = 1,
  type,
  info
}) => {
  let color = 'bg-red-500';
  let statusText = 'Disconnected';
  
  if (isConnected) {
    if (quality > 0.7) { color = 'bg-green-500'; statusText = 'Excellent'; }
    else if (quality > 0.4) { color = 'bg-yellow-500'; statusText = 'Fair'; }
    else { color = 'bg-orange-500'; statusText = 'Poor'; }
  }
  
  const tooltipContent = info || `Connection: ${statusText}${type ? ` (${type})` : ''}${isConnected ? ` - Quality: ${Math.round(quality * 100)}%` : ''}`;
  
  return (
    <div title={tooltipContent} className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-sm font-medium">{statusText}</span>
      {type && <span className="text-xs text-gray-500">({type})</span>}
    </div>
  );
};

export const SecuritySummary: React.FC<SecuritySummaryProps> = ({
  securityLevel,
  encryptionStatus,
  peerVerificationEnabled,
  verifiedParticipants,
  totalParticipants,
  connectionStrength,
  isDirectConnection
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const securityDetails = {
    [SecurityLevel.STANDARD]: { title: 'Standard Security', features: ['Transport encryption', 'Basic authentication', 'Connection monitoring'] },
    [SecurityLevel.ENHANCED]: { title: 'Enhanced Security', features: ['End-to-end encryption', 'Secure key exchange', 'Connection monitoring', 'Enhanced authentication'] },
    [SecurityLevel.MAXIMUM]: { title: 'Maximum Security', features: ['End-to-end encryption', 'Peer verification required', 'Secure key exchange', 'Connection monitoring', 'Enhanced authentication', 'Session logging'] }
  };
  
  const levelColor = securityLevel === SecurityLevel.MAXIMUM ? 'bg-green-500/20 text-green-400' : securityLevel === SecurityLevel.ENHANCED ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400';
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer ${levelColor}`}
      >
        <Shield className="w-4 h-4" />
        {securityDetails[securityLevel].title}
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
            <div className="flex items-center justify-between p-3 border-b border-gray-700">
              <span className="font-bold text-white">Security Status</span>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-300">Security Level:</span>
                <SecurityBadge level={securityLevel} size="sm" />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-300">Encryption:</span>
                <EncryptionBadge status={encryptionStatus} size="sm" />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-300">Peer Verification:</span>
                <span className={`text-xs px-1.5 rounded ${peerVerificationEnabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {peerVerificationEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-300">Verified:</span>
                <span className="text-sm"><span className="font-bold text-green-400">{verifiedParticipants}</span> / {totalParticipants}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-300">Connection:</span>
                <ConnectionStatus isConnected={true} quality={connectionStrength} type={isDirectConnection ? 'P2P Direct' : 'Via Relay'} />
              </div>
              <div className="pt-2 border-t border-gray-700">
                <span className="font-medium text-gray-300 block mb-1">Security Features:</span>
                <ul className="space-y-1">
                  {securityDetails[securityLevel].features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-400">
                      <CheckCircle className="w-3 h-3 text-green-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
