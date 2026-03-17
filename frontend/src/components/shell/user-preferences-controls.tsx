'use client';

import Link from 'next/link';
import { Focus, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { useUiPreferencesStore } from '@/stores/ui-preferences-store';

export function UserPreferencesControls() {
  const fontSize = useUiPreferencesStore((state) => state.fontSize);
  const setFontSize = useUiPreferencesStore((state) => state.setFontSize);
  const focusMode = useUiPreferencesStore((state) => state.focusMode);
  const toggleFocusMode = useUiPreferencesStore((state) => state.toggleFocusMode);

  return (
    <div className="flex items-center gap-2">
      <Tooltip label="Keyboard shortcuts guide">
        <Link href="/shortcuts" className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm hover:bg-muted">
          Shortcuts
        </Link>
      </Tooltip>
      <Tooltip label="Font size adjustment">
        <div className="flex items-center rounded-md border border-border">
          <Button variant="ghost" className="h-9 rounded-r-none px-2" onClick={() => setFontSize('sm')} aria-label="Small font size">
            <Type className="h-3.5 w-3.5" />
          </Button>
          <Button variant={fontSize === 'base' ? 'outline' : 'ghost'} className="h-9 rounded-none px-2" onClick={() => setFontSize('base')}>
            A
          </Button>
          <Button variant={fontSize === 'lg' ? 'outline' : 'ghost'} className="h-9 rounded-l-none px-2" onClick={() => setFontSize('lg')}>
            A+
          </Button>
        </div>
      </Tooltip>
      <Tooltip label="Focus mode">
        <Button variant={focusMode ? 'default' : 'outline'} className="h-9 gap-1 px-3" onClick={toggleFocusMode}>
          <Focus className="h-4 w-4" />
          Focus
        </Button>
      </Tooltip>
    </div>
  );
}
