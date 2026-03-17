'use client';

import { Breadcrumbs } from '@/components/shell/breadcrumbs';
import { MainHeader } from '@/components/shell/main-header';
import { Sidebar } from '@/components/shell/sidebar';
import { Button } from '@/components/ui/button';
import { useUiPreferencesStore } from '@/stores/ui-preferences-store';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const focusMode = useUiPreferencesStore((state) => state.focusMode);
  const setFocusMode = useUiPreferencesStore((state) => state.setFocusMode);

  return (
    <div className={`min-h-screen bg-background transition-all duration-300 ${focusMode ? '' : 'md:flex'}`}>
      {focusMode ? null : <Sidebar />}
      <div className="flex min-w-0 flex-1 flex-col">
        {focusMode ? (
          <div className="flex justify-end p-4 no-print">
            <Button variant="outline" onClick={() => setFocusMode(false)}>
              Exit focus mode
            </Button>
          </div>
        ) : (
          <MainHeader />
        )}
        <div className="page-transition space-y-4 p-4">
          {focusMode ? null : <Breadcrumbs />}
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
