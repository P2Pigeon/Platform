import React from 'react';

export interface ResponsiveLayoutProps {
  children: React.ReactNode;
  maxWidth?: number;
  style?: React.CSSProperties;
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveLayoutProps> = ({ children, maxWidth = 900, style, className = '' }) => (
  <div
    className={`pigeon-responsive-container ${className}`}
    style={{
      width: '100%',
      maxWidth,
      margin: '0 auto',
      padding: '0 24px',
      boxSizing: 'border-box',
      ...style,
    }}
  >
    {children}
  </div>
);
