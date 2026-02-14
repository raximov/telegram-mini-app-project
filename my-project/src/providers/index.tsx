/**
 * Providers
 * React context providers for the application
 */

'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ErrorBoundary, LoadingPage } from '@/components/common';
import { useTelegram } from '@/hooks';
import { useAuthStore, useUserStore } from '@/store';
import { authService } from '@/services/api';

// Page imports
import StudentDashboard from '@/pages/student/Dashboard';
import StudentTestPage from '@/pages/student/TestTaking';
import StudentResultPage from '@/pages/student/ResultPage';
import TeacherDashboard from '@/pages/teacher/Dashboard';
import { TeacherTestCreatePage, TeacherTestEditPage, TeacherResultsPage } from '@/pages/teacher/TestBuilder';

// ============================================
// Query Client Configuration
// ============================================

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: (failureCount, error) => {
          if (error instanceof Error) {
            const message = error.message.toLowerCase();
            if (message.includes('unauthorized') || message.includes('forbidden') || message.includes('not found')) {
              return false;
            }
          }
          return failureCount < 3;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// ============================================
// Auth Guard Component
// ============================================

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: ('student' | 'teacher')[];
}

function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { token, isAuthenticated } = useAuthStore();
  const { user } = useUserStore();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (token && !user) {
        try {
          await authService.getProfile();
        } catch {
          // Auth failed
        }
      }
      setIsChecking(false);
    };

    checkAuth();
  }, [token, user]);

  if (isChecking) {
    return <LoadingPage message="Checking authentication..." />;
  }

  if (!token || !isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const redirectPath = user.role === 'teacher' ? '/teacher' : '/student';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

// ============================================
// Telegram Auth Handler
// ============================================

function TelegramAuthHandler() {
  const { isTelegram, isReady, initData } = useTelegram();
  const { token, setToken, setError } = useAuthStore();
  const { setUser } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleSelect, setShowRoleSelect] = useState(false);

  useEffect(() => {
    const authenticate = async () => {
      if (isTelegram && isReady && initData && !token) {
        setIsLoading(true);
        try {
          const authResult = await authService.loginWithTelegram(initData);
          setToken(authResult.token);

          const profile = await authService.getProfile();
          setUser(profile);
        } catch (error) {
          console.error('Telegram auth failed:', error);
          setError('Authentication failed. Please try again.');
          setShowRoleSelect(true);
        } finally {
          setIsLoading(false);
        }
      } else if (!isTelegram) {
        setShowRoleSelect(true);
      }
    };

    authenticate();
  }, [isTelegram, isReady, initData, token, setToken, setUser, setError]);

  const handleDevLogin = async (role: 'student' | 'teacher') => {
    setIsLoading(true);
    try {
      const mockToken = 'dev-token-' + Date.now();
      setToken(mockToken);

      const mockUser = {
        id: 1,
        username: role === 'teacher' ? 'teacher1' : 'student1',
        email: `${role}@example.com`,
        first_name: role === 'teacher' ? 'John' : 'Jane',
        last_name: role === 'teacher' ? 'Doe' : 'Smith',
        role,
        telegram_id: 123456789,
        telegram_username: role + '_user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        courses: [],
      };

      setUser(mockUser as any);
    } catch (error) {
      setError('Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingPage message="Authenticating..." />;
  }

  if (token && !showRoleSelect) {
    return null;
  }

  if (showRoleSelect) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Test App</h1>
            <p className="text-muted-foreground">Select your role to continue</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleDevLogin('student')}
              className="w-full p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
            >
              <h2 className="font-semibold">Student</h2>
              <p className="text-sm text-muted-foreground">Take tests and view results</p>
            </button>

            <button
              onClick={() => handleDevLogin('teacher')}
              className="w-full p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
            >
              <h2 className="font-semibold">Teacher</h2>
              <p className="text-sm text-muted-foreground">Create tests and view student results</p>
            </button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Development mode - Running outside Telegram
          </p>
        </div>
      </div>
    );
  }

  return <LoadingPage message="Loading..." />;
}

// ============================================
// Root Router
// ============================================

function RootRouter() {
  const { token } = useAuthStore();
  const { user } = useUserStore();

  const getDefaultRoute = () => {
    if (!token) return '/';
    if (user?.role === 'teacher') return '/teacher';
    return '/student';
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={
          token && user ? (
            <Navigate to={getDefaultRoute()} replace />
          ) : (
            <TelegramAuthHandler />
          )
        }
      />

      {/* Student routes */}
      <Route
        path="/student"
        element={
          <AuthGuard allowedRoles={['student']}>
            <Routes>
              <Route index element={<StudentDashboard />} />
              <Route path="tests" element={<StudentDashboard />} />
              <Route path="test/:testId" element={<StudentTestPage />} />
              <Route path="result/:attemptId" element={<StudentResultPage />} />
            </Routes>
          </AuthGuard>
        }
      />

      {/* Teacher routes */}
      <Route
        path="/teacher"
        element={
          <AuthGuard allowedRoles={['teacher']}>
            <Routes>
              <Route index element={<TeacherDashboard />} />
              <Route path="tests" element={<TeacherDashboard />} />
              <Route path="tests/create" element={<TeacherTestCreatePage />} />
              <Route path="tests/:testId" element={<TeacherTestEditPage />} />
              <Route path="results/:testId" element={<TeacherResultsPage />} />
            </Routes>
          </AuthGuard>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
}

// ============================================
// Main Providers Component
// ============================================

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/*" element={<AppLayout />}>
              <Route path="*" element={<RootRouter />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
