/**
 * Main Page Entry Point
 * Telegram Mini App - Test Application
 */

'use client';

import dynamic from 'next/dynamic';

// Dynamically import Providers with SSR disabled to avoid BrowserRouter issues
const Providers = dynamic(() => import('@/providers').then((mod) => mod.Providers), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  ),
});

export default function HomePage() {
  return <Providers />;
}
