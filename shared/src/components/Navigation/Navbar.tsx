import React from 'react';

export interface NavbarProps {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
}

export const Navbar: React.FC<NavbarProps> = ({ left, center, right }) => (
  <nav style={{
    width: '100%', height: 60, background: '#1976d2', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', boxSizing: 'border-box', boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
  }}>
    <div>{left}</div>
    <div style={{ fontWeight: 700, fontSize: 20 }}>{center}</div>
    <div>{right}</div>
  </nav>
);
