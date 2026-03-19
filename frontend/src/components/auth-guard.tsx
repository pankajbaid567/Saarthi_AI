'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Explicitly check for tokens initially since Zustand persist might not have hydrated yet if using persistance,
    // though here we rely on the state. 
    // It's good to ensure we don't redirect needlessly, but if state says false, redirect.
    if (!isAuthenticated) {
      // Check if localStorage has it in case state is lagging
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('accessToken') : null;
      if (!token) {
        router.replace('/login');
      } else {
        // If token exists but state says false, we might want to restore state (handled elsewhere usually or ignore if it's fine)
        // For strictness, if not authenticated in state, send to login unless token is there.
        // But for this guard, if not authenticated, redirect:
        if (!isAuthenticated) {
           // We will trust state if token is also absent. If state just didn't update but token is there, we might wait.
        }
      }
    }
  }, [isAuthenticated, router]);

  // To avoid flicker, we block rendering the protected layout until the client mounts.
  // We also make sure if they really aren't authenticated, we don't show the skeleton.
  if (!isClient) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-6 w-6 animate-pulse rounded-full bg-primary/50" />
      </div>
    );
  }

  // If client loaded and we are not authenticated (and no token), we return null to completely prevent flash.
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('accessToken') : null;
  if (!isAuthenticated && !token) {
    return (
      <div className="flex bg-background h-screen w-full items-center justify-center">
        <div className="h-6 w-6 animate-pulse rounded-full bg-primary/50" />
      </div>
    );
  }

  return <>{children}</>;
}