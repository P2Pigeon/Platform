import React from 'react';
/**
 * GlobalUXContext provides methods to show notifications and loading overlays globally.
 */
interface Notification {
    id: number;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
}
interface GlobalUXContextType {
    showNotification: (message: string, type?: Notification['type']) => void;
    setLoading: (loading: boolean) => void;
}
export declare const useGlobalUX: () => GlobalUXContextType;
export declare const GlobalUXProvider: React.FC<{
    children: React.ReactNode;
}>;
export {};
/**
 * Usage:
 * In your app root: <GlobalUXProvider><App /></GlobalUXProvider>
 * In any component: const { showNotification, setLoading } = useGlobalUX();
 */
//# sourceMappingURL=GlobalUX.d.ts.map