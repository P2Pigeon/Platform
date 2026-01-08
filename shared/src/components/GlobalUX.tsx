import React, { useState, useCallback, createContext, useContext } from 'react';

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

const GlobalUXContext = createContext<GlobalUXContextType | undefined>(undefined);

export const useGlobalUX = () => {
  const ctx = useContext(GlobalUXContext);
  if (!ctx) throw new Error('useGlobalUX must be used within GlobalUXProvider');
  return ctx;
};

export const GlobalUXProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const showNotification = useCallback((message: string, type: Notification['type'] = 'info') => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3500);
  }, []);

  return (
    <GlobalUXContext.Provider value={{ showNotification, setLoading }}>
      {children}
      {/* Loading Overlay */}
      {loading && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.25)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            <span style={{ fontSize: 18, fontWeight: 'bold' }}>Loading…</span>
          </div>
        </div>
      )}
      {/* Notifications */}
      <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 10000 }}>
        {notifications.map((n) => (
          <div key={n.id} style={{
            marginBottom: 12,
            padding: '12px 20px',
            borderRadius: 6,
            background: n.type === 'error' ? '#ffe5e5' : n.type === 'success' ? '#e6ffed' : n.type === 'warning' ? '#fffbe6' : '#e6f7ff',
            color: n.type === 'error' ? '#d32f2f' : n.type === 'success' ? '#388e3c' : n.type === 'warning' ? '#ad8b00' : '#0277bd',
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            minWidth: 220
          }}>
            {n.message}
          </div>
        ))}
      </div>
    </GlobalUXContext.Provider>
  );
};

/**
 * Usage:
 * In your app root: <GlobalUXProvider><App /></GlobalUXProvider>
 * In any component: const { showNotification, setLoading } = useGlobalUX();
 */
