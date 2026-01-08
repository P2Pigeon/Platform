import React from 'react';
import { NotificationItem, NotificationType } from './NotificationItem';

export interface NotificationsProps {
  notifications: { id: number; message: string; type?: NotificationType }[];
}

export const Notifications: React.FC<NotificationsProps> = ({ notifications }) => (
  <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 10000 }}>
    {notifications.map((n) => (
      <NotificationItem key={n.id} message={n.message} type={n.type} />
    ))}
  </div>
);
