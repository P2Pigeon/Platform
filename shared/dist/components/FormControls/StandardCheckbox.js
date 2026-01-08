"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandardCheckbox = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const StandardCheckbox = ({ label, ...rest }) => ((0, jsx_runtime_1.jsxs)("label", { style: { display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }, children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", ...rest }), label] }));
exports.StandardCheckbox = StandardCheckbox;
