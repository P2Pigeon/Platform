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
 * API Utilities
 * 
 * Type-safe API request handling with error management.
 */
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, AxiosHeaders } from 'axios';

// API response interface to ensure type safety
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// Error interface for consistent error handling
export interface ApiError {
  message: string;
  field?: string;
  code?: string;
}

// API request configuration with typesafety
export interface ApiRequestConfig extends AxiosRequestConfig {
  skipErrorHandling?: boolean;
}

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_TARGET || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Add request interceptor for auth tokens
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Ensure headers object is properly typed for Axios
      if (!config.headers) {
        config.headers = new AxiosHeaders();
      }
      
      // Use set method to properly add Authorization header
      if ('set' in config.headers) {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        // Fallback for older Axios versions - use type assertion for headers
        const currentHeaders = config.headers || {};
        config.headers = {
          ...currentHeaders as Record<string, string>,
          Authorization: `Bearer ${token}`
        } as any; // Type assertion needed for backward compatibility
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Add response interceptor for consistent error handling
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 unauthorized errors by redirecting to login
    if (error.response?.status === 401) {
      // Clear auth token
      localStorage.removeItem('auth_token');
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = `/login?redirect=${window.location.pathname}`;
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * Type-safe GET request
 * @param url - The API endpoint
 * @param config - Axios request config
 * @returns Promise with typed response data
 */
export const get = async <T>(url: string, config?: ApiRequestConfig): Promise<T> => {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.get(url, config);
    return response.data.data;
  } catch (error) {
    handleApiError(error as AxiosError, config);
    throw error;
  }
};

/**
 * Type-safe POST request
 * @param url - The API endpoint
 * @param data - The request payload
 * @param config - Axios request config
 * @returns Promise with typed response data
 */
export const post = async <T>(url: string, data?: any, config?: ApiRequestConfig): Promise<T> => {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.post(url, data, config);
    return response.data.data;
  } catch (error) {
    handleApiError(error as AxiosError, config);
    throw error;
  }
};

/**
 * Type-safe PUT request
 * @param url - The API endpoint
 * @param data - The request payload
 * @param config - Axios request config
 * @returns Promise with typed response data
 */
export const put = async <T>(url: string, data?: any, config?: ApiRequestConfig): Promise<T> => {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.put(url, data, config);
    return response.data.data;
  } catch (error) {
    handleApiError(error as AxiosError, config);
    throw error;
  }
};

/**
 * Type-safe DELETE request
 * @param url - The API endpoint
 * @param config - Axios request config
 * @returns Promise with typed response data
 */
export const del = async <T>(url: string, config?: ApiRequestConfig): Promise<T> => {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await apiClient.delete(url, config);
    return response.data.data;
  } catch (error) {
    handleApiError(error as AxiosError, config);
    throw error;
  }
};

/**
 * Handle API errors consistently
 * @param error - Axios error object
 * @param config - Original request config
 */
const handleApiError = (error: AxiosError, config?: ApiRequestConfig): void => {
  // Skip error handling if specified in config
  if (config?.skipErrorHandling) return;
  
  const errorResponse = error.response?.data as ApiResponse | undefined;
  
  // Log error for monitoring/debugging
  console.error('API Error:', {
    status: error.response?.status,
    url: error.config?.url,
    message: errorResponse?.message || error.message,
    errors: errorResponse?.errors,
  });
};

export default {
  get,
  post,
  put,
  delete: del,
};
