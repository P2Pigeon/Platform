"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessibleButton = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const AccessibleButton = ({ label, icon, loading = false, variant = 'primary', fullWidth = false, className = '', children, ...rest }) => {
    const baseStyle = {
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
    return ((0, jsx_runtime_1.jsxs)("button", { type: "button", "aria-label": label, className: `pigeon-btn pigeon-btn--${variant} ${className}`, style: baseStyle, disabled: loading || rest.disabled, ...rest, children: [icon && (0, jsx_runtime_1.jsx)("span", { style: { marginRight: label || children ? 8 : 0 }, children: icon }), loading ? (0, jsx_runtime_1.jsx)("span", { style: { fontSize: 14 }, children: "Loading\u2026" }) : label || children] }));
};
exports.AccessibleButton = AccessibleButton;
