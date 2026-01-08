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
 * @file Notifications.tsx
 * @description Standardized notification components for consistent user feedback.
 */

import React, { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { Info, AlertTriangle, AlertCircle, CheckCircle, BellOff, Lock, X, Loader2 } from 'lucide-react';

export type NotificationStatus = 'info' | 'warning' | 'error' | 'success';

interface NotificationOptions {
  title?: string;
  message: string;
  status: NotificationStatus;
  duration?: number | null;
}

interface Toast {
  id: string;
  title?: string;
  message: string;
  status: NotificationStatus;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);
  
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);
  
  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const statusConfig = {
    info: { bg: 'bg-blue-500/90', Icon: Info },
    warning: { bg: 'bg-yellow-500/90', Icon: AlertTriangle },
    error: { bg: 'bg-red-500/90', Icon: AlertCircle },
    success: { bg: 'bg-green-500/90', Icon: CheckCircle }
  };
  const { bg, Icon } = statusConfig[toast.status];
  
  return (
    <div className={`${bg} text-white p-4 rounded shadow-lg min-w-[300px] flex items-start gap-3`}>
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        {toast.title && <p className="font-semibold">{toast.title}</p>}
        <p className="text-sm">{toast.message}</p>
      </div>
      <button onClick={onClose} className="text-white/80 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const useNotification = () => {
  const context = useContext(ToastContext);
  
  const showNotification = useCallback((options: NotificationOptions) => {
    if (context) {
      context.addToast({ title: options.title, message: options.message, status: options.status });
    }
  }, [context]);
  
  return {
    info: (message: string, title?: string) => showNotification({ title, message, status: 'info' }),
    success: (message: string, title?: string) => showNotification({ title, message, status: 'success' }),
    warning: (message: string, title?: string) => showNotification({ title, message, status: 'warning' }),
    error: (message: string, title?: string) => showNotification({ title, message, status: 'error' }),
    security: (message: string, title?: string) => showNotification({ title: title || 'Security Alert', message, status: 'info' }),
    errorWithRetry: (message: string, details?: string, onRetry?: () => void) => {
      if (context) {
        context.addToast({ title: 'Error', message: `${message}${details ? ` - ${details}` : ''}`, status: 'error' });
      }
    },
    clearAll: () => {}
  };
};

interface StandardAlertProps {
  title?: string;
  message: string;
  status: NotificationStatus;
  isClosable?: boolean;
  actionButton?: React.ReactNode;
  onClose?: () => void;
}

export const StandardAlert: React.FC<StandardAlertProps> = ({ title, message, status, isClosable = true, actionButton, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  if (!isVisible) return null;
  
  const statusConfig = {
    info: { bg: 'bg-blue-500/20 border-blue-500', text: 'text-blue-400', Icon: Info },
    warning: { bg: 'bg-yellow-500/20 border-yellow-500', text: 'text-yellow-400', Icon: AlertTriangle },
    error: { bg: 'bg-red-500/20 border-red-500', text: 'text-red-400', Icon: AlertCircle },
    success: { bg: 'bg-green-500/20 border-green-500', text: 'text-green-400', Icon: CheckCircle }
  };
  const { bg, text, Icon } = statusConfig[status];
  
  return (
    <div className={`${bg} ${text} border rounded-md p-4 mb-4`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          {title && <span className="font-semibold">{title}</span>}
        </div>
        {isClosable && (
          <button onClick={() => { setIsVisible(false); onClose?.(); }} className="hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <p className="mt-2">{message}</p>
      {actionButton && <div className="mt-4">{actionButton}</div>}
    </div>
  );
};

interface CollapsibleAlertProps extends StandardAlertProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CollapsibleAlert: React.FC<CollapsibleAlertProps> = ({ isOpen, onClose, ...alertProps }) => {
  if (!isOpen) return null;
  return <StandardAlert {...alertProps} isClosable={true} onClose={onClose} />;
};

interface LoadingIndicatorProps {
  message?: string;
  withSpinner?: boolean;
  withProgress?: boolean;
  progressValue?: number;
  size?: 'sm' | 'md' | 'lg';
  isSecurityOperation?: boolean;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'Loading...',
  withSpinner = true,
  withProgress = false,
  progressValue = 0,
  size = 'md',
  isSecurityOperation = false
}) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8';
  const textSize = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base';
  
  return (
    <div className="p-4 rounded-md bg-gray-800 border border-gray-700 shadow-sm">
      <div className={`flex items-center justify-center gap-3 ${withProgress ? 'mb-3' : ''}`}>
        {withSpinner && (
          <Loader2 className={`${sizeClass} ${isSecurityOperation ? 'text-green-500' : 'text-blue-500'} animate-spin`} />
        )}
        <div className="flex items-center gap-2">
          {isSecurityOperation && <Lock className="w-4 h-4 text-green-500" />}
          <span className={`${textSize} font-medium`}>{message}</span>
        </div>
      </div>
      {withProgress && (
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${isSecurityOperation ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${progressValue}%` }}
          />
        </div>
      )}
    </div>
  );
};

export const NoNotificationsIndicator: React.FC = () => (
  <div className="p-6 rounded-md bg-gray-900 text-center">
    <BellOff className="w-8 h-8 text-gray-400 mx-auto mb-3" />
    <p className="text-gray-500">No notifications at this time</p>
  </div>
);
