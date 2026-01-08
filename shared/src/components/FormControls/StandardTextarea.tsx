import React from 'react';

export interface TextAreaInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const StandardTextarea: React.FC<TextAreaInputProps> = ({ label, error, ...rest }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <label style={{ fontWeight: 500, display: 'block', marginBottom: 4 }}>{label}</label>}
    <textarea
      {...rest}
      style={{
        width: '100%',
        padding: '10px 12px',
        border: error ? '1.5px solid #d32f2f' : '1.5px solid #bdbdbd',
        borderRadius: 6,
        fontSize: 16,
        outline: 'none',
        minHeight: 80,
        marginBottom: error ? 4 : 0,
      }}
    />
    {error && <div style={{ color: '#d32f2f', fontSize: 13 }}>{error}</div>}
  </div>
);
