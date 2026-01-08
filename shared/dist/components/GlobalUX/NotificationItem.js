"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationItem = void 0;
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
const NotificationItem = ({ message, type = 'info' }) => ((0, jsx_runtime_1.jsx)("div", { style: {
        marginBottom: 12,
        padding: '12px 20px',
        borderRadius: 6,
        background: backgroundColors[type],
        color: textColors[type],
        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
        minWidth: 220
    }, children: message }));
exports.NotificationItem = NotificationItem;
