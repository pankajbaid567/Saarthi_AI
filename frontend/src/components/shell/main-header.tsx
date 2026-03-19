'use client';

import { CommandPalette } from '@/components/shell/command-palette';
import { ThemeToggle } from '@/components/shell/theme-toggle';
import { UserPreferencesControls } from '@/components/shell/user-preferences-controls';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { usePathname } from 'next/navigation';

export function MainHeader() {
  const pathname = usePathname();
  
  // Quick breadcrumb/title generator based on pathname (can be extended)
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname.includes('/subjects')) return 'Subjects Library';
    if (pathname.includes('/tests/generate')) return 'Generate Test';
    if (pathname.includes('/tests/history')) return 'Test History';
    if (pathname.includes('/syllabus-flow')) return 'Syllabus Flow';
    if (pathname.includes('/mains')) return 'Mains Evaluation';
    if (pathname.includes('/chat')) return 'AI Tutor';
    return 'Saarthi AI';
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border/40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-6 py-3 z-10 sticky top-0 transition-colors no-print">
      
      {/* Title & Breadcrumbs Context */}
      <div className="flex items-center gap-4 flex-1">
        <h2 className="text-sm font-medium tracking-tight text-foreground md:text-base hidden sm:block">
          {getPageTitle()}
        </h2>
        
        {/* Separator */}
        <div className="hidden sm:block h-3 w-px bg-border/60" />
        
        {/* Search Input (Cmdk Trigger) */}
        <div className="w-full max-w-xs md:max-w-sm">
          <CommandPalette />
        </div>
      </div>

      {/* Global Actions (Right aligned) */}
      <div className="flex items-center gap-2">
        <NotificationCenter />
        <ThemeToggle />
        <div className="h-4 w-px bg-border mx-1" />
        <UserPreferencesControls />
      </div>
      
    </header>
  );
}
