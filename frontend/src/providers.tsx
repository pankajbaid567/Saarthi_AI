'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { useEffect, useState } from 'react';
import { useUiPreferencesStore } from '@/stores/ui-preferences-store';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
  );
  const hydrateUiPreferences = useUiPreferencesStore((state) => state.hydrate);
  const fontSize = useUiPreferencesStore((state) => state.fontSize);
  const hydrated = useUiPreferencesStore((state) => state.hydrated);

  useEffect(() => {
    hydrateUiPreferences();
  }, [hydrateUiPreferences]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    document.documentElement.dataset.fontSize = fontSize;
  }, [fontSize, hydrated]);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || window.location.hostname === 'localhost') {
      return;
    }

    void navigator.serviceWorker.register('/sw.js');
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
