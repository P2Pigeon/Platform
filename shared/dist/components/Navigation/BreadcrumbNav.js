"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BreadcrumbNav = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const BreadcrumbNav = ({ items }) => ((0, jsx_runtime_1.jsx)("nav", { "aria-label": "breadcrumb", style: { padding: '12px 0', fontSize: 15, color: '#1976d2' }, children: items.map((item, idx) => ((0, jsx_runtime_1.jsxs)("span", { children: [(0, jsx_runtime_1.jsx)("button", { onClick: item.onClick, style: { background: 'none', border: 'none', color: '#1976d2', cursor: 'pointer', fontWeight: 500, textDecoration: 'underline' }, children: item.label }), idx < items.length - 1 && (0, jsx_runtime_1.jsx)("span", { style: { margin: '0 8px' }, children: "/" })] }, item.label))) }));
exports.BreadcrumbNav = BreadcrumbNav;
