"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadingOverlay = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const LoadingOverlay = () => ((0, jsx_runtime_1.jsx)("div", { style: {
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(0,0,0,0.25)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }, children: (0, jsx_runtime_1.jsx)("div", { style: { padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }, children: (0, jsx_runtime_1.jsx)("span", { style: { fontSize: 18, fontWeight: 'bold' }, children: "Loading\u2026" }) }) }));
exports.LoadingOverlay = LoadingOverlay;
