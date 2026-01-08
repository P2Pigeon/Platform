"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalUXProvider = exports.useGlobalUX = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const Notifications_1 = require("./Notifications");
const LoadingOverlay_1 = require("./LoadingOverlay");
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
    return ((0, jsx_runtime_1.jsxs)(GlobalUXContext.Provider, { value: { showNotification, setLoading }, children: [children, loading && (0, jsx_runtime_1.jsx)(LoadingOverlay_1.LoadingOverlay, {}), (0, jsx_runtime_1.jsx)(Notifications_1.Notifications, { notifications: notifications })] }));
};
exports.GlobalUXProvider = GlobalUXProvider;
