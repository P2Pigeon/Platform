/**
 * P2Pigeon - Secure P2P Communication Platform
 * 
 * @license AGPL-3.0 - https://opensource.org/licenses/AGPL-3.0
 * @copyright 2024-2026 P2Pigeon Contributors
 * @see https://github.com/p2pigeon/platform
 * 
 * Last updated: 2026-01-07
 */

import React, { useEffect, useState } from 'react';

/**
 * A debugging component that logs startup information and catches errors
 * This helps diagnose rendering issues in the P2Pigeon application
 */
const DebugLogger: React.FC = () => {
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Log when component mounts
    console.log('DebugLogger mounted');
    
    // Track when the component has finished rendering
    setIsLoaded(true);
    
    // Set up global error handler
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Add error to our state
      setErrors(prev => [...prev, args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ')]);
      
      // Call original console.error
      originalConsoleError.apply(console, args);
    };
    
    // Log environment information
    console.log('Environment:', {
      nodeEnv: process.env.NODE_ENV,
      browserInfo: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`
    });
    
    return () => {
      // Restore original console.error when component unmounts
      console.error = originalConsoleError;
    };
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/80 text-white p-4 z-[9999] max-h-[50vh] overflow-y-auto">
      <div className="flex flex-col items-start gap-2">
        <h2 className="text-lg font-bold">P2Pigeon Debug Console</h2>
        <p>Component Loaded: {isLoaded ? 'Yes' : 'No'}</p>
        
        {errors.length > 0 && (
          <>
            <h3 className="text-sm font-bold text-red-300">Runtime Errors:</h3>
            {errors.map((error, i) => (
              <code key={i} className="w-full p-2 bg-red-900/50 text-red-300 rounded text-sm">
                {error}
              </code>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default DebugLogger;
