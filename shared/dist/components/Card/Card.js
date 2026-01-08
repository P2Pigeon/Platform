"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Card = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const Card = ({ children, variant = 'standard', statusColor, header, footer, className = '', ...rest }) => {
    let borderColor = '#e0e0e0';
    if (variant === 'status' && statusColor)
        borderColor = statusColor;
    if (variant === 'feature')
        borderColor = '#2196f3';
    if (variant === 'meeting')
        borderColor = '#43a047';
    return ((0, jsx_runtime_1.jsxs)("div", { className: `pigeon-card pigeon-card--${variant} ${className}`, style: {
            border: `1.5px solid ${borderColor}`,
            borderRadius: 12,
            padding: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            background: '#fff',
            marginBottom: 20,
            ...rest.style,
        }, ...rest, children: [header && (0, jsx_runtime_1.jsx)("div", { style: { marginBottom: 12, fontWeight: 600 }, children: header }), (0, jsx_runtime_1.jsx)("div", { children: children }), footer && (0, jsx_runtime_1.jsx)("div", { style: { marginTop: 12 }, children: footer })] }));
};
exports.Card = Card;
