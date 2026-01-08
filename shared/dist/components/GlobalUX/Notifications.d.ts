import React from 'react';
import { NotificationType } from './NotificationItem';
export interface NotificationsProps {
    notifications: {
        id: number;
        message: string;
        type?: NotificationType;
    }[];
}
export declare const Notifications: React.FC<NotificationsProps>;
//# sourceMappingURL=Notifications.d.ts.map