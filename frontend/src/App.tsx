/**
 * P2Pigeon - Secure P2P Communication Platform
 * 
 * @license AGPL-3.0 - https://opensource.org/licenses/AGPL-3.0
 * @copyright 2024-2026 P2Pigeon Contributors
 * @see https://github.com/p2pigeon/platform
 * 
 * Last updated: 2026-01-07
 */

/**
 * @file App.tsx
 * @description Main application component for P2Pigeon.
 * 
 * This component serves as the root of the React application, setting up global providers,
 * theme, routing, and error boundaries.
 * 
 * @module App
 */
import React, { Suspense, useState, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { CommunicationProvider } from './context/CommunicationContext';
import { AuthProvider } from './context/AuthContext';
import { ProtocolConfig, CommunicationProtocol, WebRTCConfig } from './types/core';
import AppRoutes from './routes/index';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/shared/Notifications';

const initialConfigs: ProtocolConfig[] = [
  {
    protocol: CommunicationProtocol.WEBRTC,
    enabled: true,
    config: {
      iceServers: [
        { urls: ['stun:stun.l.google.com:19302'] },
        { urls: ['stun:stun1.l.google.com:19302'] },
        { 
          urls: ['turn:openrelay.metered.ca:443'],
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ],
      maxRetries: 5
    } as WebRTCConfig
  }
];

const LoadingFallback: React.FC = () => (
  <div className="h-screen flex items-center justify-center bg-gray-900">
    <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
  </div>
);

const App: React.FC = () => {
  const [hasRenderError, setHasRenderError] = useState<boolean>(false);
  const [renderStep, setRenderStep] = useState<string>('starting');
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      setHasRenderError(true);
    };

    const initialize = async () => {
      try {
        console.log('P2Pigeon App Initializing...');
        setIsInitialized(true);
        console.log('P2Pigeon App Initialized Successfully');
      } catch (error) {
        console.error('Error initializing application:', error);
        setHasRenderError(true);
      }
    };
    
    initialize();
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  try {
    return (
      <ErrorBoundary>
        <ToastProvider>
          <div className="min-h-screen bg-gray-900 text-white">
            {hasRenderError && (
              <div className="fixed top-0 left-0 right-0 p-5 bg-red-50 text-red-900 z-[9999]">
                Rendering error detected. Check console for details.
              </div>
            )}
            
            <AuthProvider>
              <CommunicationProvider initialConfigs={initialConfigs}>
                <Suspense fallback={<LoadingFallback />}>
                  <RouterProvider router={AppRoutes} />
                </Suspense>
              </CommunicationProvider>
            </AuthProvider>
          </div>
        </ToastProvider>
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('Render error in App component:', error);
    
    return (
      <div className="p-5 bg-gray-900 text-white min-h-screen">
        <h1 className="text-xl font-bold mb-4">P2Pigeon - Error during startup</h1>
        <p className="mb-2">There was an error loading the application. Technical details:</p>
        <pre className="bg-gray-800 p-4 rounded mb-4">{error instanceof Error ? error.message : String(error)}</pre>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
        >
          Reload Application
        </button>
      </div>
    );
  }
};

export default App;
