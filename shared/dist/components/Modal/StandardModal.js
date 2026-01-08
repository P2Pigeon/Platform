"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandardModal = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const StandardModal = ({ open, title, onClose, children, footer }) => {
    if (!open)
        return null;
    return ((0, jsx_runtime_1.jsx)("div", { style: {
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.25)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }, children: (0, jsx_runtime_1.jsxs)("div", { style: { background: '#fff', borderRadius: 10, minWidth: 340, maxWidth: 480, boxShadow: '0 2px 16px rgba(0,0,0,0.18)', padding: 28, position: 'relative' }, children: [(0, jsx_runtime_1.jsx)("button", { onClick: onClose, "aria-label": "Close", style: { position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }, children: "\u00D7" }), title && (0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 700, fontSize: 20, marginBottom: 20 }, children: title }), (0, jsx_runtime_1.jsx)("div", { children: children }), footer && (0, jsx_runtime_1.jsx)("div", { style: { marginTop: 24 }, children: footer })] }) }));
};
exports.StandardModal = StandardModal;
