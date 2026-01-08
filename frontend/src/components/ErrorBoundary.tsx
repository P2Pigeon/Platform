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
 * @file ErrorBoundary.tsx
 * @description A generic React Error Boundary component to catch JavaScript errors anywhere in its child component tree.
 * 
 * This component logs the errors and displays a fallback UI instead of the component tree that crashed.
 * It is a critical component for application stability and user experience.
 * 
 * @module Components/ErrorBoundary
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * @interface ErrorBoundaryProps
 * @description Props for the ErrorBoundary component.
 */
interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Custom fallback component to render on error */
  fallback?: ReactNode;
  /** Optional error reporting function */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * @interface ErrorBoundaryState
 * @description State for the ErrorBoundary component.
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * @class ErrorBoundary
 * @extends Component<ErrorBoundaryProps, ErrorBoundaryState>
 * @description A class component that implements the React error boundary concept.
 * It must be a class component because it utilizes the `getDerivedStateFromError` and `componentDidCatch` lifecycle methods.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * @static
   * @method getDerivedStateFromError
   * @description This lifecycle method is used to render a fallback UI after an error has been thrown.
   * @param {Error} error - The error that was thrown.
   * @returns {ErrorBoundaryState} A state update to indicate an error has occurred.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * @method componentDidCatch
   * @description This lifecycle method is used to log error information.
   * @param {Error} error - The error that was thrown.
   * @param {ErrorInfo} errorInfo - An object with a `componentStack` key containing information about which component threw the error.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    this.setState({ errorInfo });
  }

  /**
   * @method resetErrorBoundary
   * @description Resets the error boundary state, allowing the user to try rendering the component tree again.
   */
  resetErrorBoundary = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="max-w-2xl mx-auto py-8 px-4">
          <div className="flex flex-col items-center justify-center text-center bg-red-50 dark:bg-red-900/20 rounded-md py-6 mb-6">
            <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
            <h2 className="text-lg font-semibold mb-1">Something went wrong</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm">
              The application encountered an unexpected error.
            </p>
          </div>
          
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Error Details</h3>
              <p className="text-red-500">{this.state.error?.toString()}</p>
            </div>
            
            {process.env.NODE_ENV !== 'production' && this.state.errorInfo && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Component Stack</h3>
                <code className="block whitespace-pre-wrap overflow-x-auto p-4 rounded-md bg-gray-100 dark:bg-gray-700 text-sm">
                  {this.state.errorInfo.componentStack}
                </code>
              </div>
            )}
            
            <button 
              onClick={this.resetErrorBoundary}
              className="self-center mt-4 px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
