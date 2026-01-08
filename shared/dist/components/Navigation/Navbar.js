"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Navbar = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const Navbar = ({ left, center, right }) => ((0, jsx_runtime_1.jsxs)("nav", { style: {
        width: '100%', height: 60, background: '#1976d2', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', boxSizing: 'border-box', boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    }, children: [(0, jsx_runtime_1.jsx)("div", { children: left }), (0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 700, fontSize: 20 }, children: center }), (0, jsx_runtime_1.jsx)("div", { children: right })] }));
exports.Navbar = Navbar;
