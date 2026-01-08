import React, { useState, useCallback, createContext, useContext } from 'react';
import { Notifications } from './Notifications';
import { LoadingOverlay } from './LoadingOverlay';
import { NotificationType } from './NotificationItem';

interface Notification {
  id: number;
  message: string;
  type?: NotificationType;
}

interface GlobalUXContextType {
  showNotification: (message: string, type?: NotificationType) => void;
  setLoading: (loading: boolean) => void;
}

const GlobalUXContext = createContext<GlobalUXContextType | undefined>(undefined);

export const useGlobalUX = () => {
  const ctx = useContext(GlobalUXContext);
  if (!ctx) throw new Error('useGlobalUX must be used within GlobalUXProvider');
  return ctx;
};

export const GlobalUXProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3500);
  }, []);

  return (
    <GlobalUXContext.Provider value={{ showNotification, setLoading }}>
      {children}
      {loading && <LoadingOverlay />}
      <Notifications notifications={notifications} />
    </GlobalUXContext.Provider>
  );
};
