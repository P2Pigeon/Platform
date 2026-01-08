"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponsiveContainer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const ResponsiveContainer = ({ children, maxWidth = 900, style, className = '' }) => ((0, jsx_runtime_1.jsx)("div", { className: `pigeon-responsive-container ${className}`, style: {
        width: '100%',
        maxWidth,
        margin: '0 auto',
        padding: '0 24px',
        boxSizing: 'border-box',
        ...style,
    }, children: children }));
exports.ResponsiveContainer = ResponsiveContainer;
