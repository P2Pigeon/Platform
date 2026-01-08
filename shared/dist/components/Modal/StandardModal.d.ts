import React from 'react';
export interface BaseModalProps {
    open: boolean;
    title?: string;
    onClose: () => void;
    children: React.ReactNode;
    footer?: React.ReactNode;
}
export declare const StandardModal: React.FC<BaseModalProps>;
//# sourceMappingURL=StandardModal.d.ts.map