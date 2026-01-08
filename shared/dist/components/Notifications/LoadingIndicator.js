"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadingIndicator = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const LoadingIndicator = ({ message = 'Loading…' }) => ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', alignItems: 'center', gap: 8, color: '#1976d2', fontWeight: 600, fontSize: 16 }, children: [(0, jsx_runtime_1.jsx)("span", { className: "pigeon-loading-spinner", style: { width: 18, height: 18, border: '3px solid #1976d2', borderTop: '3px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' } }), message, (0, jsx_runtime_1.jsx)("style", { children: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }` })] }));
exports.LoadingIndicator = LoadingIndicator;
