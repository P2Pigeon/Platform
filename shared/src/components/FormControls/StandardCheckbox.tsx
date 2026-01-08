import React from 'react';

export interface CheckboxInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const StandardCheckbox: React.FC<CheckboxInputProps> = ({ label, ...rest }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
    <input type="checkbox" {...rest} />
    {label}
  </label>
);
