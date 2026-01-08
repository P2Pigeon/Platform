"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmationModal = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const StandardModal_1 = require("./StandardModal");
const ConfirmationModal = ({ open, title, message, onClose, onConfirm, confirmText = 'Confirm', cancelText = 'Cancel', footer }) => ((0, jsx_runtime_1.jsxs)(StandardModal_1.StandardModal, { open: open, title: title, onClose: onClose, footer: footer, children: [(0, jsx_runtime_1.jsx)("div", { style: { marginBottom: 24 }, children: message }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: 12, justifyContent: 'flex-end' }, children: [(0, jsx_runtime_1.jsx)("button", { onClick: onClose, children: cancelText }), (0, jsx_runtime_1.jsx)("button", { onClick: onConfirm, style: { background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600 }, children: confirmText })] })] }));
exports.ConfirmationModal = ConfirmationModal;
