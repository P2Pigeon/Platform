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
 * @file CardComponents.tsx
 * @description Standardized card components for displaying content in a consistent manner. */

import React, { ReactNode, useState } from 'react';
import { MoreVertical, Shield, Clock, Calendar, User, Users, Lock, Unlock } from 'lucide-react';

interface BaseCardProps {
  title?: React.ReactNode;
  subtitle?: string;
  children: ReactNode;
  isHoverable?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
  footer?: ReactNode;
  actions?: Array<{ label: string; icon?: React.ElementType; onClick: () => void }>;
}

interface StatusCardProps extends BaseCardProps {
  status?: string;
  statusColorScheme?: string;
  statusIcon?: React.ElementType;
}

interface MeetingCardProps extends Omit<BaseCardProps, 'children'> {
  children?: ReactNode;
  meetingId: string;
  hostName: string;
  startTime: Date;
  securityLevel: 'STANDARD' | 'ENHANCED' | 'MAXIMUM';
  participantCount: number;
  maxParticipants?: number;
  isEncrypted: boolean;
  requiresVerification: boolean;
  participants?: Array<{ id: string; name: string; avatarUrl?: string }>;
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  isEnabled?: boolean;
  isAvailable?: boolean;
  actionText?: string;
  onAction?: () => void;
}

export const StandardCard: React.FC<BaseCardProps> = ({
  title, subtitle, children, isHoverable = false, isSelected = false, isDisabled = false, onClick, footer, actions
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  
  return (
    <div
      className={`border overflow-hidden transition-all duration-200 ${
        isSelected 
          ? 'bg-cyan-500/5 border-cyan-400 shadow-[0_0_30px_rgba(0,255,255,0.3)]' 
          : 'bg-gray-900 border-cyan-600 shadow-[0_0_20px_rgba(0,255,255,0.1)]'
      } ${isDisabled ? 'opacity-60' : ''} ${onClick ? 'cursor-pointer' : ''} ${
        isHoverable && !isDisabled ? 'hover:shadow-[0_0_35px_rgba(0,255,255,0.4)] hover:border-cyan-500 hover:-translate-y-0.5' : ''
      }`}
      onClick={isDisabled ? undefined : onClick}
      role={onClick ? 'button' : undefined}
      aria-disabled={isDisabled}
    >
      {(title || subtitle || actions) && (
        <div className="flex justify-between items-center p-4">
          <div>
            {title && <h3 className="text-lg font-semibold text-cyan-500">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-cyan-400">{subtitle}</p>}
          </div>
          {actions && actions.length > 0 && (
            <div className="relative">
              <button
                aria-label="Options"
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                className="p-2 text-gray-400 hover:bg-gray-700 rounded"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-1 w-40 bg-gray-800 border border-gray-700 rounded shadow-lg z-50">
                    {actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={(e) => { e.stopPropagation(); action.onClick(); setMenuOpen(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                      >
                        {action.icon && <action.icon className="w-4 h-4" />}
                        {action.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
      <div className={`p-4 ${(title || subtitle) ? 'pt-0' : ''}`}>{children}</div>
      {footer && <div className="p-4 border-t border-cyan-600 bg-gray-900">{footer}</div>}
    </div>
  );
};

export const StatusCard: React.FC<StatusCardProps> = ({ status, statusColorScheme = 'blue', statusIcon: StatusIcon, ...props }) => {
  const colorMap: Record<string, string> = { blue: 'bg-blue-500/20 text-blue-400', green: 'bg-green-500/20 text-green-400', red: 'bg-red-500/20 text-red-400', yellow: 'bg-yellow-500/20 text-yellow-400', cyan: 'bg-cyan-500/20 text-cyan-400' };
  return (
    <StandardCard
      {...props}
      title={
        <div className="flex items-center gap-2">
          {props.title}
          {status && (
            <span className={`inline-flex items-center gap-1 px-2 text-xs rounded ${colorMap[statusColorScheme] || colorMap.blue}`}>
              {StatusIcon && <StatusIcon className="w-3 h-3" />}
              {status}
            </span>
          )}
        </div>
      }
    />
  );
};

export const MeetingCard: React.FC<MeetingCardProps> = ({
  meetingId, hostName, startTime, securityLevel, participantCount, maxParticipants, isEncrypted, requiresVerification, participants, ...props
}) => {
  const securityConfig = {
    STANDARD: { color: 'bg-cyan-500/20 text-cyan-400', Icon: Shield, label: 'Standard' },
    ENHANCED: { color: 'bg-blue-500/20 text-blue-400', Icon: Lock, label: 'Enhanced' },
    MAXIMUM: { color: 'bg-cyan-500/20 text-cyan-400', Icon: Lock, label: 'Maximum' }
  };
  const security = securityConfig[securityLevel];
  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (date: Date) => date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  
  return (
    <StandardCard
      {...props}
      isHoverable
      footer={
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {participants && participants.length > 0 && (
              <div className="flex -space-x-2">
                {participants.slice(0, 3).map((p) => (
                  <div key={p.id} className="w-6 h-6 rounded-full bg-gray-600 border-2 border-gray-800 flex items-center justify-center text-xs text-white">
                    {p.name.charAt(0)}
                  </div>
                ))}
              </div>
            )}
            <span className="text-sm text-cyan-400">
              {participantCount} {participantCount === 1 ? 'participant' : 'participants'}{maxParticipants ? ` / ${maxParticipants}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 text-xs rounded ${security.color}`}>
              <security.Icon className="w-2.5 h-2.5" />{security.label}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 text-xs rounded ${isEncrypted ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-500/20 text-gray-400'}`}>
              {isEncrypted ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
              {isEncrypted ? 'Encrypted' : 'Not Encrypted'}
            </span>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-cyan-400 truncate">ID: {meetingId}</p>
        <div className="flex gap-4 flex-wrap">
          <span className="flex items-center gap-1 text-sm text-cyan-300"><User className="w-4 h-4 text-cyan-500" />{hostName}</span>
          <span className="flex items-center gap-1 text-sm text-cyan-300"><Calendar className="w-4 h-4 text-cyan-500" />{formatDate(startTime)}</span>
          <span className="flex items-center gap-1 text-sm text-cyan-300"><Clock className="w-4 h-4 text-cyan-500" />{formatTime(startTime)}</span>
        </div>
        {requiresVerification && (
          <span className="inline-flex items-center gap-1 px-2 text-xs rounded bg-cyan-500/20 text-cyan-400">
            <Users className="w-2.5 h-2.5" />Verification Required
          </span>
        )}
      </div>
    </StandardCard>
  );
};

export const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon: Icon, isEnabled = true, isAvailable = true, actionText, onAction }) => {
  return (
    <StandardCard isDisabled={!isAvailable}>
      <div className="flex flex-col gap-4">
        <div className={`w-12 h-12 flex items-center justify-center border ${isAvailable ? 'bg-cyan-500/10 border-cyan-600' : 'bg-gray-700 border-gray-600'}`}>
          <Icon className={`w-6 h-6 ${isAvailable ? 'text-cyan-400' : 'text-gray-400'}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-cyan-500">{title}</h3>
            {!isEnabled && isAvailable && <span className="px-2 text-xs rounded bg-cyan-500/20 text-cyan-400">Coming Soon</span>}
            {!isAvailable && <span className="px-2 text-xs rounded bg-gray-500/20 text-gray-400">Premium Feature</span>}
          </div>
          <p className={`mt-2 ${isAvailable ? 'text-cyan-400' : 'text-gray-400'}`}>{description}</p>
        </div>
        {isAvailable && actionText && onAction && (
          <button onClick={onAction} disabled={!isEnabled} className="self-start px-4 py-2 bg-cyan-600 text-white text-sm rounded hover:bg-cyan-700 disabled:opacity-50">
            {actionText}
          </button>
        )}
      </div>
    </StandardCard>
  );
};
