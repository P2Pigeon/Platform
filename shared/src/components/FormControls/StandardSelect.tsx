import React from 'react';

export interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const StandardSelect: React.FC<SelectInputProps> = ({ label, error, options, ...rest }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ fontWeight: 500, display: 'block', marginBottom: 4 }}>{label}</label>}
    <select
      {...rest}
      style={{
        width: '100%',
        padding: '10px 12px',
        border: error ? '1.5px solid #d32f2f' : '1.5px solid #bdbdbd',
        borderRadius: 6,
        fontSize: 16,
        outline: 'none',
        marginBottom: error ? 4 : 0,
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <div style={{ color: '#d32f2f', fontSize: 13 }}>{error}</div>}
  </div>
);
