import React from 'react';

export interface BreadcrumbNavProps {
  items: { label: string; onClick: () => void }[];
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ items }) => (
  <nav aria-label="breadcrumb" style={{ padding: '12px 0', fontSize: 15, color: '#1976d2' }}>
    {items.map((item, idx) => (
      <span key={item.label}>
        <button onClick={item.onClick} style={{ background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', fontWeight: 500, textDecoration: 'underline' }}>{item.label}</button>
        {idx < items.length - 1 && <span style={{ margin: '0 8px' }}>/</span>}
      </span>
    ))}
  </nav>
);
