/**
 * Custom Utility Hooks
 * Reusable hooks for common functionality
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useUserStore, useUIStore, useAttemptStore } from '@/store';
import { authService } from '@/services/api';
import {
  getTelegramWebApp,
  isTelegramWebApp,
  getTelegramUser,
  getTelegramInitData,
  initTelegramWebApp,
  applyTelegramTheme,
  configureBackButton,
  hideBackButton,
  hapticFeedback,
  showAlert,
  showConfirm,
} from '@/lib/telegram';

// ============================================
// Telegram Integration Hooks
// ============================================

/**
 * Hook to initialize and access Telegram WebApp
 */
export function useTelegram() {
  const [isReady, setIsReady] = useState(() => !isTelegramWebApp());
  const { setTheme } = useUIStore();

  useEffect(() => {
    if (isTelegramWebApp()) {
      initTelegramWebApp();
      applyTelegramTheme();

      // Listen for theme changes
      const webApp = getTelegramWebApp();
      if (webApp) {
        // Set initial theme
        setTheme(webApp.colorScheme);
        // Note: Telegram doesn't have a native theme change event,
        // but we can check periodically or use CSS variables
      }
      // Use setTimeout to defer state update outside of effect sync execution
      const timer = setTimeout(() => setIsReady(true), 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [setTheme]);

  const webApp = getTelegramWebApp();
  const user = getTelegramUser();
  const initData = getTelegramInitData();

  return {
    isReady,
    isTelegram: isTelegramWebApp(),
    webApp,
    user,
    initData,
    platform: webApp?.platform || 'unknown',
    version: webApp?.version || '0.0',
    colorScheme: webApp?.colorScheme || 'light',
  };
}

/**
 * Hook for Telegram back button
 */
export function useTelegramBackButton(onBack: () => void, deps: unknown[] = []) {
  const { isTelegram } = useTelegram();
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = useCallback(() => {
    hapticFeedback('selection');
    onBack();
  }, [onBack]);

  useEffect(() => {
    if (isTelegram) {
      configureBackButton(handleBack, true);

      return () => {
        hideBackButton();
      };
    }
  }, [isTelegram, handleBack, ...deps]);
}

/**
 * Hook for Telegram main button
 */
export function useTelegramMainButton(
  text: string,
  onClick: () => void,
  options?: {
    color?: string;
    textColor?: string;
    isActive?: boolean;
    isLoading?: boolean;
  }
) {
  const { isTelegram } = useTelegram();

  useEffect(() => {
    if (isTelegram) {
      const tgWebApp = getTelegramWebApp();
      if (!tgWebApp) return;

      tgWebApp.MainButton.setText(text);
      tgWebApp.MainButton.show();

      if (options?.color) {
        tgWebApp.MainButton.color = options.color;
      }
      if (options?.textColor) {
        tgWebApp.MainButton.textColor = options.textColor;
      }
      if (options?.isActive !== undefined) {
        if (options.isActive) {
          tgWebApp.MainButton.enable();
        } else {
          tgWebApp.MainButton.disable();
        }
      }
      if (options?.isLoading !== undefined) {
        if (options.isLoading) {
          tgWebApp.MainButton.showProgress();
        } else {
          tgWebApp.MainButton.hideProgress();
        }
      }

      tgWebApp.MainButton.onClick(onClick);

      return () => {
        tgWebApp.MainButton.offClick(onClick);
        tgWebApp.MainButton.hide();
      };
    }
    return undefined;
  }, [isTelegram, text, onClick, options]);
}

/**
 * Hook for haptic feedback
 */
export function useHapticFeedback() {
  const { isTelegram } = useTelegram();

  const trigger = useCallback(
    (type: 'impact' | 'notification' | 'selection', style?: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' | 'error' | 'success' | 'warning') => {
      if (isTelegram) {
        hapticFeedback(type, style);
      }
    },
    [isTelegram]
  );

  return {
    impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => trigger('impact', style),
    notification: (type: 'error' | 'success' | 'warning' = 'success') => trigger('notification', type),
    selection: () => trigger('selection'),
  };
}

// ============================================
// Authentication Hooks
// ============================================

/**
 * Hook to check authentication status and redirect if needed
 */
export function useAuth(redirectTo?: string) {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuthStore();
  const { user } = useUserStore();

  useEffect(() => {
    if (!token && redirectTo) {
      navigate(redirectTo);
    }
  }, [token, navigate, redirectTo]);

  return {
    isAuthenticated: !!token && isAuthenticated,
    user,
    role: user?.role || null,
  };
}

/**
 * Hook to protect routes by role
 */
export function useRoleGuard(allowedRoles: ('student' | 'teacher')[], redirectTo: string = '/') {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user && !allowedRoles.includes(user.role)) {
      navigate(redirectTo);
    }
  }, [isAuthenticated, user, allowedRoles, navigate, redirectTo]);

  return {
    isAuthorized: isAuthenticated && user && allowedRoles.includes(user.role),
  };
}

// ============================================
// Timer Hook
// ============================================

/**
 * Hook for countdown timer (for tests)
 */
export function useTimer(initialSeconds: number, onExpire?: () => void) {
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onExpireRef = useRef(onExpire);

  // Keep callback ref updated
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback((newTime?: number) => {
    setTimeRemaining(newTime ?? initialSeconds);
    setIsRunning(false);
  }, [initialSeconds]);

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            onExpireRef.current?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining]);

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    timeRemaining,
    formattedTime: formatTime(timeRemaining),
    isRunning,
    isExpired: timeRemaining === 0,
    progress: initialSeconds > 0 ? (timeRemaining / initialSeconds) * 100 : 0,
    start,
    pause,
    reset,
  };
}

// ============================================
// Auto-save Hook
// ============================================

/**
 * Hook to auto-save form data
 */
export function useAutoSave<T>(
  data: T,
  saveFunction: (data: T) => Promise<void>,
  delay: number = 3000
) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dataRef = useRef(data);

  // Keep data ref updated
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      setError(null);

      try {
        await saveFunction(dataRef.current);
        setLastSaved(new Date());
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, saveFunction, delay]);

  return { isSaving, lastSaved, error };
}

// ============================================
// Network Status Hook
// ============================================

/**
 * Hook to track online/offline status
 */
export function useNetworkStatus() {
  const { isOnline, setOnline } = useUIStore();
  const { showToast } = useUIStore();

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      showToast({ type: 'success', title: 'Connection restored' });
    };

    const handleOffline = () => {
      setOnline(false);
      showToast({ type: 'error', title: 'No internet connection' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline, showToast]);

  return isOnline;
}

// ============================================
// Debounce Hook
// ============================================

/**
 * Hook to debounce a value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================
// Local Storage Hook
// ============================================

/**
 * Hook to persist state in local storage
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

// ============================================
// Click Outside Hook
// ============================================

/**
 * Hook to detect clicks outside an element
 */
export function useClickOutside<T extends HTMLElement>(callback: () => void) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [callback]);

  return ref;
}

// ============================================
// Intersection Observer Hook
// ============================================

/**
 * Hook for intersection observer (lazy loading)
 */
export function useIntersectionObserver(
  options?: IntersectionObserverInit
): [React.RefObject<HTMLDivElement | null>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return [ref, isIntersecting];
}

// ============================================
// Previous Value Hook
// ============================================

/**
 * Hook to get previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const [prevValue, setPrevValue] = useState<T | undefined>(undefined);
  const currentRef = useRef<T>(value);

  useEffect(() => {
    setPrevValue(currentRef.current);
    currentRef.current = value;
  }, [value]);

  return prevValue;
}
