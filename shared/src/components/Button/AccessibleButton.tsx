import React from 'react';

export interface EnhancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

export const AccessibleButton: React.FC<EnhancedButtonProps> = ({
  label,
  icon,
  loading = false,
  variant = 'primary',
  fullWidth = false,
  className = '',
  children,
  ...rest
}) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    borderRadius: 8,
    border: 'none',
    padding: '10px 20px',
    fontSize: 16,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1,
    width: fullWidth ? '100%' : undefined,
    transition: 'background 0.2s, color 0.2s',
    background: variant === 'primary' ? '#1976d2' : variant === 'secondary' ? '#f5f5f5' : variant === 'danger' ? '#d32f2f' : 'transparent',
    color: variant === 'primary' ? '#fff' : variant === 'secondary' ? '#333' : variant === 'danger' ? '#fff' : '#1976d2',
    boxShadow: variant === 'ghost' ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
    borderBottom: variant === 'ghost' ? '1.5px solid #1976d2' : undefined,
  };
  return (
    <button
      type="button"
      aria-label={label}
      className={`pigeon-btn pigeon-btn--${variant} ${className}`}
      style={baseStyle}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {icon && <span style={{ marginRight: label || children ? 8 : 0 }}>{icon}</span>}
      {loading ? <span style={{ fontSize: 14 }}>Loading…</span> : label || children}
    </button>
  );
};
