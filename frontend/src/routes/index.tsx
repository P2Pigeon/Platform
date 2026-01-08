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
 * @file index.tsx
 * @description Application routing configuration for P2Pigeon.
 * 
 * This file defines the application's URL structure and associates routes with their respective components.
 * It implements lazy loading for protected pages to improve initial load times and separates public
 * and protected routes to enforce authentication and authorization.
 * 
 * @module Routes
 */
import React, { lazy, Suspense } from 'react';
import { 
  createBrowserRouter, 
  createRoutesFromElements, 
  Route,
  Navigate
} from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import ErrorBoundary from '../components/ErrorBoundary';
import ProtectedRoute from '../components/ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';

import NotFoundPage from '../pages/NotFoundPage';
import MaintenancePage from '../pages/MaintenancePage';
import PrivacyPage from '../pages/PrivacyPage';
import AboutPage from '../pages/AboutPage';
import LoginPage from '../pages/LoginPage';
import LandingPage from '../pages/LandingPage';
import PermissionPage from '../pages/PermissionPage';

const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const StartCall = lazy(() => import('../pages/StartCall'));
const RoomPage = lazy(() => import('../pages/RoomPage'));
const DataRoom = lazy(() => import('../pages/DataRoom'));
const FileTransfer = lazy(() => import('../pages/FileTransfer'));
const Profile = lazy(() => import('../pages/Profile'));
const Settings = lazy(() => import('../pages/Settings'));
const TestStunTurnPage = lazy(() => import('../pages/TestStunTurnPage'));
const NostrChatPage = lazy(() => import('../pages/NostrChatPage'));
const ContactsPage = lazy(() => import('../pages/ContactsPage'));

const RouteLoadingFallback: React.FC = () => (
  <div className="h-screen w-full flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mx-auto" />
      <div className="mt-4 text-gray-400">Loading...</div>
    </div>
  </div>
);

/**
 * @constant appRouter
 * @description The main router instance for the application, created using `react-router-dom`.
 * 
 * It defines the entire routing hierarchy:
 * - A root route with a global error boundary.
 * - Public routes for landing and login pages.
 * - A nested section for protected routes under the `/app` path, guarded by `ProtectedRoute`.
 * - A catch-all route that redirects any unknown paths to the landing page.
 */
const appRouter = createBrowserRouter(
  createRoutesFromElements(
    <Route
      path="/"
      errorElement={
        <ErrorBoundary>
          <div>Something went wrong</div>
        </ErrorBoundary>
      }
    >
            {/* Public Routes */}
      <Route index element={<LandingPage />} />
      
      <Route path="maintenance" element={<MaintenancePage />} />
      <Route path="privacy" element={<PrivacyPage />} />
      <Route path="about" element={<AboutPage />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="permission" element={<PermissionPage />} />
      

      {/* Protected Routes under /app */}
      <Route
        path="app"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <DashboardPage />
            </Suspense>
          }
        />
        <Route
          path="calls"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <StartCall />
            </Suspense>
          }
        />
        <Route
          path="join/:roomId"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <RoomPage />
            </Suspense>
          }
        />
        <Route
          path="test-stun-turn"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <TestStunTurnPage />
            </Suspense>
          }
        />
        <Route
          path="files"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <FileTransfer />
            </Suspense>
          }
        />
        <Route
          path="data-room/:roomId"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <DataRoom />
            </Suspense>
          }
        />
        <Route
          path="profile"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <Profile />
            </Suspense>
          }
        />
        <Route
          path="settings"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <Settings />
            </Suspense>
          }
        />
        <Route
          path="chat"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <NostrChatPage />
            </Suspense>
          }
        />
        <Route
          path="contacts"
          element={
            <Suspense fallback={<RouteLoadingFallback />}>
              <ContactsPage />
            </Suspense>
          }
        />
      </Route>

      {/* Catch-all route for 404 Not Found pages */}
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  )
);

export default appRouter;
