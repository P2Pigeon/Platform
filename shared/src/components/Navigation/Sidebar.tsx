import React from 'react';

export interface SidebarProps {
  items: { label: string; icon?: React.ReactNode; onClick: () => void; active?: boolean }[];
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ items, header, footer }) => (
  <aside style={{ width: 220, background: '#fafbfc', borderRight: '1.5px solid #e0e0e0', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
    <div>
      {header && <div style={{ padding: 24 }}>{header}</div>}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item, idx) => (
          <li key={item.label}>
            <button
              onClick={item.onClick}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%', background: item.active ? '#e3f2fd' : 'none', border: 'none', borderRadius: 8, padding: '12px 20px', margin: '4px 0', fontWeight: 600, color: item.active ? '#1976d2' : '#333', cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
              }}
            >
              {item.icon && <span>{item.icon}</span>}
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
    {footer && <div style={{ padding: 24 }}>{footer}</div>}
  </aside>
);
