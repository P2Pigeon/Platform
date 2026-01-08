import React from 'react';

export interface LoadingIndicatorProps {
  message?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message = 'Loading…' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1976d2', fontWeight: 600, fontSize: 16 }}>
    <span className="pigeon-loading-spinner" style={{ width: 18, height: 18, border: '3px solid #1976d2', borderTop: '3px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
    {message}
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);
