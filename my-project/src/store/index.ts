/**
 * Zustand Store
 * Central state management for the Telegram Mini App
 */

import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  AuthState,
  UserState,
  TestState,
  AttemptState,
  UIState,
  Student,
  Teacher,
  Test,
  Attempt,
  AttemptAnswer,
  SubmitAnswerRequest,
  TestFilters,
  Toast,
} from '@/types';
import { secureStorage } from '@/lib/api-client';
import { STORAGE_KEYS } from '@/lib/api-config';

// ============================================
// Auth Store
// ============================================

interface AuthStore extends AuthState {
  setToken: (token: string, expiry?: number) => void;
  clearToken: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      immer((set) => ({
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        tokenExpiry: null,

        setToken: (token, expiry) =>
          set((state) => {
            state.token = token;
            state.isAuthenticated = true;
            state.error = null;
            if (expiry) {
              state.tokenExpiry = expiry;
            }
          }),

        clearToken: () =>
          set((state) => {
            state.token = null;
            state.isAuthenticated = false;
            state.tokenExpiry = null;
            state.error = null;
          }),

        setLoading: (isLoading) =>
          set((state) => {
            state.isLoading = isLoading;
          }),

        setError: (error) =>
          set((state) => {
            state.error = error;
          }),
      })),
      {
        name: STORAGE_KEYS.AUTH_TOKEN,
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state) => ({
          token: state.token,
          isAuthenticated: state.isAuthenticated,
          tokenExpiry: state.tokenExpiry,
        }),
      }
    ),
    { name: 'auth-store' }
  )
);

// ============================================
// User Store
// ============================================

interface UserStore extends UserState {
  setUser: (user: Student | Teacher | null) => void;
  setProfile: (profile: NonNullable<UserState['profile']>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      immer((set) => ({
        user: null,
        profile: null,
        isLoading: false,
        error: null,

        setUser: (user) =>
          set((state) => {
            state.user = user;
            state.error = null;
          }),

        setProfile: (profile) =>
          set((state) => {
            state.profile = profile;
          }),

        setLoading: (isLoading) =>
          set((state) => {
            state.isLoading = isLoading;
          }),

        setError: (error) =>
          set((state) => {
            state.error = error;
          }),

        clearUser: () =>
          set((state) => {
            state.user = null;
            state.profile = null;
            state.error = null;
          }),
      })),
      {
        name: STORAGE_KEYS.USER_DATA,
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state) => ({ user: state.user }),
      }
    ),
    { name: 'user-store' }
  )
);

// ============================================
// Test Store
// ============================================

interface TestStore extends TestState {
  setTests: (tests: Test[]) => void;
  addTest: (test: Test) => void;
  updateTest: (testId: number, data: Partial<Test>) => void;
  removeTest: (testId: number) => void;
  setCurrentTest: (test: Test | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<TestFilters>) => void;
  clearTests: () => void;
}

export const useTestStore = create<TestStore>()(
  devtools(
    immer((set) => ({
      tests: [],
      currentTest: null,
      isLoading: false,
      error: null,
      filters: {},

      setTests: (tests) =>
        set((state) => {
          state.tests = tests;
          state.error = null;
        }),

      addTest: (test) =>
        set((state) => {
          state.tests.push(test);
        }),

      updateTest: (testId, data) =>
        set((state) => {
          const index = state.tests.findIndex((t) => t.id === testId);
          if (index !== -1) {
            state.tests[index] = { ...state.tests[index], ...data };
          }
          if (state.currentTest?.id === testId) {
            state.currentTest = { ...state.currentTest, ...data };
          }
        }),

      removeTest: (testId) =>
        set((state) => {
          state.tests = state.tests.filter((t) => t.id !== testId);
          if (state.currentTest?.id === testId) {
            state.currentTest = null;
          }
        }),

      setCurrentTest: (test) =>
        set((state) => {
          state.currentTest = test;
        }),

      setLoading: (isLoading) =>
        set((state) => {
          state.isLoading = isLoading;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),

      setFilters: (filters) =>
        set((state) => {
          state.filters = { ...state.filters, ...filters };
        }),

      clearTests: () =>
        set((state) => {
          state.tests = [];
          state.currentTest = null;
          state.error = null;
        }),
    })),
    { name: 'test-store' }
  )
);

// ============================================
// Attempt Store
// ============================================

interface AttemptStore extends AttemptState {
  setCurrentAttempt: (attempt: Attempt | null) => void;
  setAttempts: (attempts: Attempt[]) => void;
  setAnswer: (questionId: number, answer: AttemptAnswer) => void;
  updateAnswer: (questionId: number, data: Partial<AttemptAnswer>) => void;
  setTimeRemaining: (time: number | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearAttempt: () => void;
  clearAnswers: () => void;
}

export const useAttemptStore = create<AttemptStore>()(
  devtools(
    immer((set) => ({
      currentAttempt: null,
      attempts: [],
      answers: {},
      isLoading: false,
      error: null,
      timeRemaining: null,

      setCurrentAttempt: (attempt) =>
        set((state) => {
          state.currentAttempt = attempt;
          state.error = null;
        }),

      setAttempts: (attempts) =>
        set((state) => {
          state.attempts = attempts;
        }),

      setAnswer: (questionId, answer) =>
        set((state) => {
          state.answers[questionId] = answer;
        }),

      updateAnswer: (questionId, data) =>
        set((state) => {
          if (state.answers[questionId]) {
            state.answers[questionId] = {
              ...state.answers[questionId],
              ...data,
            };
          }
        }),

      setTimeRemaining: (time) =>
        set((state) => {
          state.timeRemaining = time;
        }),

      setLoading: (isLoading) =>
        set((state) => {
          state.isLoading = isLoading;
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),

      clearAttempt: () =>
        set((state) => {
          state.currentAttempt = null;
          state.answers = {};
          state.timeRemaining = null;
          state.error = null;
        }),

      clearAnswers: () =>
        set((state) => {
          state.answers = {};
        }),
    })),
    { name: 'attempt-store' }
  )
);

// ============================================
// UI Store
// ============================================

interface UIStore extends UIState {
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLoading: (isLoading: boolean) => void;
  setOnline: (isOnline: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  showToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  showConfirmModal: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
  hideConfirmModal: () => void;
}

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      immer((set) => ({
        theme: 'system',
        isLoading: false,
        isOnline: true,
        sidebarOpen: false,
        modals: {
          confirmModal: {
            isOpen: false,
            title: '',
            message: '',
          },
        },
        toasts: [],

        setTheme: (theme) =>
          set((state) => {
            state.theme = theme;
          }),

        setLoading: (isLoading) =>
          set((state) => {
            state.isLoading = isLoading;
          }),

        setOnline: (isOnline) =>
          set((state) => {
            state.isOnline = isOnline;
          }),

        setSidebarOpen: (open) =>
          set((state) => {
            state.sidebarOpen = open;
          }),

        showToast: (toast) =>
          set((state) => {
            const id = Date.now().toString();
            state.toasts.push({ ...toast, id });
          }),

        removeToast: (id) =>
          set((state) => {
            state.toasts = state.toasts.filter((t) => t.id !== id);
          }),

        showConfirmModal: (title, message, onConfirm, onCancel) =>
          set((state) => {
            state.modals.confirmModal = {
              isOpen: true,
              title,
              message,
              onConfirm,
              onCancel,
            };
          }),

        hideConfirmModal: () =>
          set((state) => {
            state.modals.confirmModal = {
              isOpen: false,
              title: '',
              message: '',
            };
          }),
      })),
      {
        name: STORAGE_KEYS.THEME,
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state) => ({ theme: state.theme }),
      }
    ),
    { name: 'ui-store' }
  )
);

// ============================================
// Combined Store Hook
// ============================================

export const useStore = () => ({
  auth: useAuthStore(),
  user: useUserStore(),
  test: useTestStore(),
  attempt: useAttemptStore(),
  ui: useUIStore(),
});

// Clear all stores
export const clearAllStores = () => {
  useAuthStore.getState().clearToken();
  useUserStore.getState().clearUser();
  useTestStore.getState().clearTests();
  useAttemptStore.getState().clearAttempt();
};
