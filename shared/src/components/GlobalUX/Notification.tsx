import React from 'react';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationProps {
  message: string;
  type?: NotificationType;
}

const backgroundColors: Record<NotificationType, string> = {
  info: '#e6f7ff',
  success: '#e6ffed',
  warning: '#fffbe6',
  error: '#ffe5e5',
};
const textColors: Record<NotificationType, string> = {
  info: '#0277bd',
  success: '#388e3c',
  warning: '#ad8b00',
  error: '#d32f2f',
};

export const Notification: React.FC<NotificationProps> = ({ message, type = 'info' }) => (
  <div style={{
    marginBottom: 12,
    padding: '12px 20px',
    borderRadius: 6,
    background: backgroundColors[type],
    color: textColors[type],
    boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
    minWidth: 220
  }}>
    {message}
  </div>
);
