"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sidebar = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const Sidebar = ({ items, header, footer }) => ((0, jsx_runtime_1.jsxs)("aside", { style: { width: 220, background: '#fafbfc', borderRight: '1.5px solid #e0e0e0', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }, children: [(0, jsx_runtime_1.jsxs)("div", { children: [header && (0, jsx_runtime_1.jsx)("div", { style: { padding: 24 }, children: header }), (0, jsx_runtime_1.jsx)("ul", { style: { listStyle: 'none', padding: 0, margin: 0 }, children: items.map((item, idx) => ((0, jsx_runtime_1.jsx)("li", { children: (0, jsx_runtime_1.jsxs)("button", { onClick: item.onClick, style: {
                                display: 'flex', alignItems: 'center', gap: 12, width: '100%', background: item.active ? '#e3f2fd' : 'none', border: 'none', borderRadius: 8, padding: '12px 20px', margin: '4px 0', fontWeight: 600, color: item.active ? '#1976d2' : '#333', cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
                            }, children: [item.icon && (0, jsx_runtime_1.jsx)("span", { children: item.icon }), item.label] }) }, item.label))) })] }), footer && (0, jsx_runtime_1.jsx)("div", { style: { padding: 24 }, children: footer })] }));
exports.Sidebar = Sidebar;
