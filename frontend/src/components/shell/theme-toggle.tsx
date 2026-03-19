'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <Button 
      variant="ghost" 
      size="icon"
      className="h-8 w-8 rounded-full"
      onClick={() => setTheme(isDark ? 'light' : 'dark')} 
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="h-[1.125rem] w-[1.125rem]" /> : <Moon className="h-[1.125rem] w-[1.125rem]" />}
    </Button>
  );
}
