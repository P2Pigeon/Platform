import React from 'react';
import { NotificationType } from './NotificationItem';
interface GlobalUXContextType {
    showNotification: (message: string, type?: NotificationType) => void;
    setLoading: (loading: boolean) => void;
}
export declare const useGlobalUX: () => GlobalUXContextType;
export declare const GlobalUXProvider: React.FC<{
    children: React.ReactNode;
}>;
export {};
//# sourceMappingURL=GlobalUXProvider.d.ts.map