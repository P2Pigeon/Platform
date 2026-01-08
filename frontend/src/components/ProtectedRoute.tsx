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
 * @file ProtectedRoute.tsx
 * @description A higher-order component that protects routes by ensuring the user is authenticated.
 * 
 * This component is a cornerstone of the application's zero-trust security model.
 * It checks for an initialized communication peer and redirects unauthenticated users to the login page.
 * 
 * @module Components/ProtectedRoute
 */
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, AuthStatus } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * @component ProtectedRoute
 * @description A component that guards routes, allowing access only to authenticated users.
 * 
 * If the user is not authenticated, it redirects them to the landing page.
 * It preserves the intended destination in the location state, allowing for a redirect back after authentication.
 * 
 * @param {React.PropsWithChildren} props The props containing the child components to render if authenticated.
 * @returns {React.ReactElement | null} The child components or null if redirecting.
 */
const ProtectedRoute: React.FC<React.PropsWithChildren> = ({ children }) => {
  const location = useLocation();
  const { status } = useAuth();
  
  // Show loading state while checking authentication
  if (status === AuthStatus.LOADING) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
          <p>Verifying secure connection...</p>
        </div>
      </div>
    );
  }

  // If authenticated or a guest, render the children (the layout)
  if (status === AuthStatus.AUTHENTICATED || status === AuthStatus.GUEST) {
    return children ? <>{children}</> : <Outlet />;
  }

  // If not authenticated, redirect to the landing page
  return <Navigate to="/" state={{ from: location }} replace />;
};

export default ProtectedRoute;
