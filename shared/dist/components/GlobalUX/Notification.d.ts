import React from 'react';
export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export interface NotificationProps {
    message: string;
    type?: NotificationType;
}
export declare const Notification: React.FC<NotificationProps>;
//# sourceMappingURL=Notification.d.ts.map