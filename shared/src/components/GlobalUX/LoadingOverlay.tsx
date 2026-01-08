import React from 'react';

export const LoadingOverlay: React.FC = () => (
  <div style={{
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    background: 'rgba(0,0,0,0.25)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
  }}>
    <div style={{ padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
      <span style={{ fontSize: 18, fontWeight: 'bold' }}>Loading…</span>
    </div>
  </div>
);
