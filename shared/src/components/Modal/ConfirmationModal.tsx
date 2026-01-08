import React from 'react';
import { StandardModal, BaseModalProps } from './StandardModal';

export interface ConfirmationModalProps extends BaseModalProps {
  message: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  footer
}) => (
  <StandardModal open={open} title={title} onClose={onClose} footer={footer}>
    <div style={{ marginBottom: 24 }}>{message}</div>
    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
      <button onClick={onClose}>{cancelText}</button>
      <button onClick={onConfirm} style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600 }}>{confirmText}</button>
    </div>
  </StandardModal>
);
