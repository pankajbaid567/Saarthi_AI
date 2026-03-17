'use client';

import { CommandPalette } from '@/components/shell/command-palette';
import { ThemeToggle } from '@/components/shell/theme-toggle';
import { UserPreferencesControls } from '@/components/shell/user-preferences-controls';
import { NotificationCenter } from '@/components/notifications/notification-center';

export function MainHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background p-4">
      <CommandPalette />
      <div className="flex items-center gap-2">
        <UserPreferencesControls />
        <NotificationCenter />
        <ThemeToggle />
      </div>
    </header>
  );
}
