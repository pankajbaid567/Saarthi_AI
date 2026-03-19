'use client';

import { MainHeader } from '@/components/shell/main-header';
import { Sidebar } from '@/components/shell/sidebar';
import { Button } from '@/components/ui/button';
import { AuthGuard } from '@/components/auth-guard';
import { cn } from '@/lib/utils';
import { useUiPreferencesStore } from '@/stores/ui-preferences-store';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const focusMode = useUiPreferencesStore((state) => state.focusMode);
  const setFocusMode = useUiPreferencesStore((state) => state.setFocusMode);

  return (
    <AuthGuard>
      <div className="flex h-screen w-full bg-background overflow-hidden relative selection:bg-primary selection:text-primary-foreground">
        {/* 1. Sidebar - Fixed left side nav */}
        {!focusMode && <Sidebar />}

        {/* 2. Main content wrapper (Vercel/Linear style floating pane) */}
        <div className={cn(
          "flex min-w-0 flex-1 flex-col transition-all duration-300 relative h-full overflow-hidden bg-card",
          !focusMode ? "md:my-2 md:mr-2 md:rounded-[1.5rem] md:shadow-float md:border md:border-border" : ""
        )}>
          
          {/* Top Header Area */}
          {focusMode ? (
            <div className="flex justify-end p-4 border-b border-border/40 backdrop-blur-md sticky top-0 z-10 no-print">
              <Button variant="outline" size="sm" onClick={() => setFocusMode(false)} className="shadow-sm">
                Exit focus mode
              </Button>
            </div>
          ) : (
            <MainHeader />
          )}

          {/* 3. Scrollable content region with max-width wrapper */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 page-transition">
            <div className="mx-auto max-w-5xl w-full flex flex-col gap-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
