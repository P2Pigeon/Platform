import React from 'react';

export interface BaseModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const StandardModal: React.FC<BaseModalProps> = ({ open, title, onClose, children, footer }) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.25)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ background: '#fff', borderRadius: 10, minWidth: 340, maxWidth: 480, boxShadow: '0 2px 16px rgba(0,0,0,0.18)', padding: 28, position: 'relative' }}>
        <button onClick={onClose} aria-label="Close" style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
        {title && <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 20 }}>{title}</div>}
        <div>{children}</div>
        {footer && <div style={{ marginTop: 24 }}>{footer}</div>}
      </div>
    </div>
  );
};
