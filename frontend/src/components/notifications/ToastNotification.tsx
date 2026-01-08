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
 * @file ToastNotification.tsx
 * @description A standardized and accessible toast notification system using a custom hook.
 * 
 * This module provides a custom hook, `useNotification`, for displaying consistent toast notifications
 * across the application, following enterprise-level design and accessibility standards.
 * 
 * @module Components/Notifications/ToastNotification
 */
import React, { useState, useCallback, useRef } from 'react';
import { Info, AlertCircle, CheckCircle, AlertTriangle, X } from 'lucide-react';

/**
 * Type for toast variants
 */
export type ToastVariant = 'info' | 'success' | 'warning' | 'error';
export type ToastId = string;

interface Toast {
  id: ToastId;
  title: string;
  description?: string;
  variant: ToastVariant;
}

/**
 * Props for custom toast content component
 */
interface ToastContentProps {
  title: string;
  description?: string;
  variant: ToastVariant;
  onClose: () => void;
}

/**
 * @component ToastContent
 * @description A custom component that renders the content of a toast notification.
 */
const ToastContent: React.FC<ToastContentProps> = ({ 
  title, 
  description, 
  variant, 
  onClose 
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'info': return <Info className="w-5 h-5" />;
      case 'success': return <CheckCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'error': return <AlertCircle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const bgClasses = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  return (
    <div 
      className={`${bgClasses[variant]} text-white p-4 rounded-md w-full`}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
    >
      <div className="flex items-start gap-4 w-full">
        {getIcon()}
        <div className="flex-1">
          <p className="font-semibold">{title}</p>
          {description && <p className="opacity-90 text-sm">{description}</p>}
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * @hook useNotification
 * @description A custom hook that provides functions to display various types of toast notifications.
 */
export const useNotification = () => {
  const toastIdRef = useRef(0);
  
  const showToast = useCallback((
    title: string,
    options?: { description?: string; variant?: ToastVariant; duration?: number }
  ): ToastId => {
    const { description, variant = 'info' } = options || {};
    const id = `toast-${++toastIdRef.current}`;
    
    // For now, use console.log as a placeholder - in a real app, this would integrate with a toast container
    console.log(`[${variant.toUpperCase()}] ${title}${description ? `: ${description}` : ''}`);
    
    return id;
  }, []);
  
  const info = useCallback((title: string, description?: string): ToastId => {
    return showToast(title, { description, variant: 'info' });
  }, [showToast]);
  
  const success = useCallback((title: string, description?: string): ToastId => {
    return showToast(title, { description, variant: 'success' });
  }, [showToast]);
  
  const warning = useCallback((title: string, description?: string): ToastId => {
    return showToast(title, { description, variant: 'warning' });
  }, [showToast]);
  
  const error = useCallback((title: string, description?: string): ToastId => {
    return showToast(title, { description, variant: 'error', duration: 10000 });
  }, [showToast]);
  
  const close = useCallback((id: ToastId): void => {
    // Placeholder - would remove toast from state
  }, []);
  
  const closeAll = useCallback((): void => {
    // Placeholder - would clear all toasts
  }, []);
  
  return {
    showToast,
    info,
    success,
    warning,
    error,
    close,
    closeAll
  };
};

export { ToastContent };
export default useNotification;
