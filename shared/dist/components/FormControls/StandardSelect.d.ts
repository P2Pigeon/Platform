import React from 'react';
export interface SelectInputProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: {
        value: string;
        label: string;
    }[];
}
export declare const StandardSelect: React.FC<SelectInputProps>;
//# sourceMappingURL=StandardSelect.d.ts.map