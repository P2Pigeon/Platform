import React, { useState } from 'react';

export interface CollapsibleAlertProps {
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  initiallyOpen?: boolean;
}

export const CollapsibleAlert: React.FC<CollapsibleAlertProps> = ({ message, type = 'info', initiallyOpen = true }) => {
  const [open, setOpen] = useState(initiallyOpen);
  if (!open) return null;
  return (
    <div style={{
      padding: '12px 20px',
      borderRadius: 6,
      background: type === 'error' ? '#ffe5e5' : type === 'success' ? '#e6ffed' : type === 'warning' ? '#fffbe6' : '#e6f7ff',
      color: type === 'error' ? '#d32f2f' : type === 'success' ? '#388e3c' : type === 'warning' ? '#ad8b00' : '#0277bd',
      fontWeight: 500,
      marginBottom: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      position: 'relative',
    }}>
      <button onClick={() => setOpen(false)} style={{ position: 'absolute', top: 8, right: 12, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>×</button>
      {message}
    </div>
  );
};
