"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalUXProvider = exports.useGlobalUX = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const GlobalUXContext = (0, react_1.createContext)(undefined);
const useGlobalUX = () => {
    const ctx = (0, react_1.useContext)(GlobalUXContext);
    if (!ctx)
        throw new Error('useGlobalUX must be used within GlobalUXProvider');
    return ctx;
};
exports.useGlobalUX = useGlobalUX;
const GlobalUXProvider = ({ children }) => {
    const [notifications, setNotifications] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const showNotification = (0, react_1.useCallback)((message, type = 'info') => {
        const id = Date.now() + Math.random();
        setNotifications((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 3500);
    }, []);
    return ((0, jsx_runtime_1.jsxs)(GlobalUXContext.Provider, { value: { showNotification, setLoading }, children: [children, loading && ((0, jsx_runtime_1.jsx)("div", { style: {
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.25)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }, children: (0, jsx_runtime_1.jsx)("div", { style: { padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }, children: (0, jsx_runtime_1.jsx)("span", { style: { fontSize: 18, fontWeight: 'bold' }, children: "Loading\u2026" }) }) })), (0, jsx_runtime_1.jsx)("div", { style: { position: 'fixed', top: 24, right: 24, zIndex: 10000 }, children: notifications.map((n) => ((0, jsx_runtime_1.jsx)("div", { style: {
                        marginBottom: 12,
                        padding: '12px 20px',
                        borderRadius: 6,
                        background: n.type === 'error' ? '#ffe5e5' : n.type === 'success' ? '#e6ffed' : n.type === 'warning' ? '#fffbe6' : '#e6f7ff',
                        color: n.type === 'error' ? '#d32f2f' : n.type === 'success' ? '#388e3c' : n.type === 'warning' ? '#ad8b00' : '#0277bd',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                        minWidth: 220
                    }, children: n.message }, n.id))) })] }));
};
exports.GlobalUXProvider = GlobalUXProvider;
