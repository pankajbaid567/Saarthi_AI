'use client';

import { CommandPalette } from '@/components/shell/command-palette';
import { ThemeToggle } from '@/components/shell/theme-toggle';

export function MainHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background p-4">
      <CommandPalette />
      <ThemeToggle />
    </header>
  );
}
