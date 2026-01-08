"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandardInput = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const StandardInput = ({ label, error, ...rest }) => ((0, jsx_runtime_1.jsxs)("div", { style: { marginBottom: 16 }, children: [label && (0, jsx_runtime_1.jsx)("label", { style: { fontWeight: 500, display: 'block', marginBottom: 4 }, children: label }), (0, jsx_runtime_1.jsx)("input", { ...rest, style: {
                width: '100%',
                padding: '10px 12px',
                border: error ? '1.5px solid #d32f2f' : '1.5px solid #bdbdbd',
                borderRadius: 6,
                fontSize: 16,
                outline: 'none',
                marginBottom: error ? 4 : 0,
            } }), error && (0, jsx_runtime_1.jsx)("div", { style: { color: '#d32f2f', fontSize: 13 }, children: error })] }));
exports.StandardInput = StandardInput;
