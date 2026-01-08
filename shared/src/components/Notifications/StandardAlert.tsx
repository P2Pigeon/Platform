import React from 'react';

export interface StandardAlertProps {
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
}

const backgroundColors = {
  info: '#e6f7ff',
  success: '#e6ffed',
  warning: '#fffbe6',
  error: '#ffe5e5',
};
const textColors = {
  info: '#0277bd',
  success: '#388e3c',
  warning: '#ad8b00',
  error: '#d32f2f',
};

export const StandardAlert: React.FC<StandardAlertProps> = ({ message, type = 'info' }) => (
  <div style={{
    padding: '12px 20px',
    borderRadius: 6,
    background: backgroundColors[type],
    color: textColors[type],
    fontWeight: 500,
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  }}>
    {message}
  </div>
);
