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
 * P2Pigeon Application Entry Point with Diagnostic Mode
 * 
 * Startup with error boundary protection and diagnostics.
 */

// Import essential polyfills for P2P secure communications first
// Must be imported before any other code
import './setupPolyfills.ts';

// Import Tailwind CSS
import './index.css';

// Then import React and other dependencies
import React from 'react';
import ReactDOM from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';



// Get root element
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);

// Enterprise-grade rendering with error monitoring
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Log initialization success
console.log('P2Pigeon initialized in full application mode');

// Add global error handler for non-React errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

