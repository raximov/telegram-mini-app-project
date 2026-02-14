/**
 * API Client
 * Centralized HTTP client with authentication, error handling, and caching
 */

import { API_BASE_URL, DEFAULT_REQUEST_CONFIG, STORAGE_KEYS, TOKEN_REFRESH_THRESHOLD } from './api-config';
import { ApiResponse, ApiError, PaginatedResponse } from '@/types';

// Types for request configuration
interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
  cacheKey?: string;
  cacheDuration?: number;
}

// In-flight requests map for deduplication
const inflightRequests = new Map<string, Promise<unknown>>();

/**
 * Storage utilities for secure token management
 */
export const secureStorage = {
  get: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // Storage might be full or disabled
    }
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  },

  clear: (): void => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.clear();
    } catch {
      // Ignore errors
    }
  },

  getJson: <T>(key: string): T | null => {
    const value = secureStorage.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },

  setJson: <T>(key: string, value: T): void => {
    try {
      secureStorage.set(key, JSON.stringify(value));
    } catch {
      // Ignore errors
    }
  },
};

/**
 * Get the current auth token
 */
export function getAuthToken(): string | null {
  return secureStorage.get(STORAGE_KEYS.AUTH_TOKEN);
}

/**
 * Set the auth token
 */
export function setAuthToken(token: string, expiry?: number): void {
  secureStorage.set(STORAGE_KEYS.AUTH_TOKEN, token);
  if (expiry) {
    secureStorage.set(STORAGE_KEYS.TOKEN_EXPIRY, expiry.toString());
  }
}

/**
 * Clear auth token and related data
 */
export function clearAuth(): void {
  secureStorage.remove(STORAGE_KEYS.AUTH_TOKEN);
  secureStorage.remove(STORAGE_KEYS.TOKEN_EXPIRY);
  secureStorage.remove(STORAGE_KEYS.USER_ROLE);
  secureStorage.remove(STORAGE_KEYS.USER_DATA);
}

/**
 * Check if token is expired or about to expire
 */
export function isTokenExpiringSoon(): boolean {
  const expiry = secureStorage.get(STORAGE_KEYS.TOKEN_EXPIRY);
  if (!expiry) return true;
  
  const expiryTime = parseInt(expiry, 10);
  return Date.now() + TOKEN_REFRESH_THRESHOLD > expiryTime;
}

/**
 * Build URL with query parameters
 */
function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  
  return url.toString();
}

/**
 * Handle API errors
 */
function handleApiError(response: Response, data?: unknown): ApiError {
  const errorData = data as Record<string, unknown>;
  
  if (response.status === 401) {
    clearAuth();
    return {
      detail: 'Authentication required. Please log in again.',
      code: 'UNAUTHORIZED',
    };
  }
  
  if (response.status === 403) {
    return {
      detail: 'You do not have permission to perform this action.',
      code: 'FORBIDDEN',
    };
  }
  
  if (response.status === 404) {
    return {
      detail: 'The requested resource was not found.',
      code: 'NOT_FOUND',
    };
  }
  
  if (response.status === 429) {
    return {
      detail: 'Too many requests. Please try again later.',
      code: 'RATE_LIMITED',
    };
  }
  
  if (response.status >= 500) {
    return {
      detail: 'Server error. Please try again later.',
      code: 'SERVER_ERROR',
    };
  }
  
  // Handle validation errors
  if (errorData?.errors && typeof errorData.errors === 'object') {
    return {
      detail: 'Validation error',
      code: 'VALIDATION_ERROR',
      errors: errorData.errors as Record<string, string[]>,
    };
  }
  
  return {
    detail: (errorData?.detail as string) || 'An unexpected error occurred.',
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Global error handler callback
 */
let globalErrorHandler: ((error: ApiError) => void) | null = null;

/**
 * Set global error handler
 */
export function setGlobalErrorHandler(handler: (error: ApiError) => void): void {
  globalErrorHandler = handler;
}

/**
 * Main fetch function with authentication and error handling
 */
export async function apiClient<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const {
    params,
    skipAuth = false,
    cacheKey,
    cacheDuration,
    headers = {},
    ...fetchConfig
  } = config;

  const url = buildUrl(endpoint, params);
  
  // Check cache for GET requests
  const isGetRequest = !fetchConfig.method || fetchConfig.method === 'GET';
  if (isGetRequest && cacheKey) {
    const cached = secureStorage.getJson<{ data: T; timestamp: number }>(
      `${STORAGE_KEYS.CACHE_PREFIX}${cacheKey}`
    );
    if (cached && Date.now() - cached.timestamp < (cacheDuration || 300000)) {
      return cached.data;
    }
  }

  // Check for in-flight requests to prevent duplicate calls
  if (isGetRequest && inflightRequests.has(url)) {
    return inflightRequests.get(url) as Promise<T>;
  }

  // Build request headers
  const requestHeaders = new Headers({
    ...DEFAULT_REQUEST_CONFIG.headers,
    ...headers,
  });

  // Add auth token if available and not skipped
  if (!skipAuth) {
    const token = getAuthToken();
    if (token) {
      requestHeaders.set('Authorization', `Token ${token}`);
    }
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_REQUEST_CONFIG.timeout);

  const requestPromise = (async () => {
    try {
      const response = await fetch(url, {
        ...fetchConfig,
        headers: requestHeaders,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response
      let data: unknown;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const error = handleApiError(response, data);
        globalErrorHandler?.(error);
        throw error;
      }

      // Cache successful GET responses
      if (isGetRequest && cacheKey) {
        secureStorage.setJson(`${STORAGE_KEYS.CACHE_PREFIX}${cacheKey}`, {
          data,
          timestamp: Date.now(),
        });
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        const apiError: ApiError = {
          detail: 'Request timed out. Please check your connection.',
          code: 'TIMEOUT',
        };
        globalErrorHandler?.(apiError);
        throw apiError;
      }
      
      // Handle network errors
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        const apiError: ApiError = {
          detail: 'Network error. Please check your internet connection.',
          code: 'NETWORK_ERROR',
        };
        globalErrorHandler?.(apiError);
        throw apiError;
      }
      
      throw error;
    } finally {
      // Remove from in-flight requests
      if (isGetRequest) {
        inflightRequests.delete(url);
      }
    }
  })();

  // Track in-flight requests for GET
  if (isGetRequest) {
    inflightRequests.set(url, requestPromise);
  }

  return requestPromise;
}

/**
 * Convenience methods for different HTTP verbs
 */
export const api = {
  get: <T>(endpoint: string, config?: RequestConfig): Promise<T> =>
    apiClient<T>(endpoint, { ...config, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> =>
    apiClient<T>(endpoint, {
      ...config,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> =>
    apiClient<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> =>
    apiClient<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, config?: RequestConfig): Promise<T> =>
    apiClient<T>(endpoint, { ...config, method: 'DELETE' }),
};

/**
 * Clear all cached data
 */
export function clearCache(): void {
  if (typeof window === 'undefined') return;
  
  Object.keys(sessionStorage)
    .filter(key => key.startsWith(STORAGE_KEYS.CACHE_PREFIX))
    .forEach(key => sessionStorage.removeItem(key));
}

export type { RequestConfig };
