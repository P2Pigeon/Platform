import React from 'react';
export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export interface NotificationItemProps {
    message: string;
    type?: NotificationType;
}
export declare const NotificationItem: React.FC<NotificationItemProps>;
//# sourceMappingURL=NotificationItem.d.ts.map