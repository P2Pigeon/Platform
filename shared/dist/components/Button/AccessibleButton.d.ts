import React from 'react';
export interface EnhancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    label?: string;
    icon?: React.ReactNode;
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    fullWidth?: boolean;
}
export declare const AccessibleButton: React.FC<EnhancedButtonProps>;
//# sourceMappingURL=AccessibleButton.d.ts.map