"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandardAlert = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const backgroundColors = {
    info: '#e6f7ff',
    success: '#e6ffed',
    warning: '#fffbe6',
    error: '#ffe5e5',
};
const textColors = {
    info: '#0277bd',
    success: '#388e3c',
    warning: '#ad8b00',
    error: '#d32f2f',
};
const StandardAlert = ({ message, type = 'info' }) => ((0, jsx_runtime_1.jsx)("div", { style: {
        padding: '12px 20px',
        borderRadius: 6,
        background: backgroundColors[type],
        color: textColors[type],
        fontWeight: 500,
        marginBottom: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    }, children: message }));
exports.StandardAlert = StandardAlert;
