import React from 'react';
import { BaseModalProps } from './StandardModal';
export interface ConfirmationModalProps extends BaseModalProps {
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
}
export declare const ConfirmationModal: React.FC<ConfirmationModalProps>;
//# sourceMappingURL=ConfirmationModal.d.ts.map