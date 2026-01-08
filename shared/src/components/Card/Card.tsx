import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'standard' | 'status' | 'meeting' | 'feature';
  statusColor?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'standard',
  statusColor,
  header,
  footer,
  className = '',
  ...rest
}) => {
  let borderColor = '#e0e0e0';
  if (variant === 'status' && statusColor) borderColor = statusColor;
  if (variant === 'feature') borderColor = '#2196f3';
  if (variant === 'meeting') borderColor = '#43a047';

  return (
    <div
      className={`pigeon-card pigeon-card--${variant} ${className}`}
      style={{
        border: `1.5px solid ${borderColor}`,
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        background: '#fff',
        marginBottom: 20,
        ...rest.style,
      }}
      {...rest}
    >
      {header && <div style={{ marginBottom: 12, fontWeight: 600 }}>{header}</div>}
      <div>{children}</div>
      {footer && <div style={{ marginTop: 12 }}>{footer}</div>}
    </div>
  );
};
