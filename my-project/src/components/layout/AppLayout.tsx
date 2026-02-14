/**
 * App Layout Component
 * Main layout wrapper with Telegram theme support
 */

'use client';

import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useTelegram, useNetworkStatus } from '@/hooks';
import { useUIStore } from '@/store';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const { isReady, isTelegram, colorScheme } = useTelegram();
  const isOnline = useNetworkStatus();
  const { theme } = useUIStore();

  // Apply theme class
  useEffect(() => {
    const root = document.documentElement;
    const effectiveTheme = theme === 'system' ? colorScheme : theme;

    if (effectiveTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme, colorScheme]);

  // Show loading state while Telegram initializes
  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'min-h-screen bg-background text-foreground',
        'antialiased',
        isTelegram && 'tg-webapp'
      )}
    >
      {/* Offline banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-destructive text-destructive-foreground text-center py-2 text-sm z-50">
          No internet connection
        </div>
      )}

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}
