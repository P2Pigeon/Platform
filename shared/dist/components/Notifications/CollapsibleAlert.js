"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollapsibleAlert = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const CollapsibleAlert = ({ message, type = 'info', initiallyOpen = true }) => {
    const [open, setOpen] = (0, react_1.useState)(initiallyOpen);
    if (!open)
        return null;
    return ((0, jsx_runtime_1.jsxs)("div", { style: {
            padding: '12px 20px',
            borderRadius: 6,
            background: type === 'error' ? '#ffe5e5' : type === 'success' ? '#e6ffed' : type === 'warning' ? '#fffbe6' : '#e6f7ff',
            color: type === 'error' ? '#d32f2f' : type === 'success' ? '#388e3c' : type === 'warning' ? '#ad8b00' : '#0277bd',
            fontWeight: 500,
            marginBottom: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            position: 'relative',
        }, children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setOpen(false), style: { position: 'absolute', top: 8, right: 12, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }, children: "\u00D7" }), message] }));
};
exports.CollapsibleAlert = CollapsibleAlert;
