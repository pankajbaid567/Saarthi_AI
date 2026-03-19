'use client';

import { Command } from 'cmdk';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const commandItems = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { id: 'subjects', label: 'Subjects', href: '/subjects' },
  { id: 'syllabus-flow', label: 'SyllabusFlow', href: '/syllabus-flow' },
  { id: 'mains-evaluation', label: 'Mains Evaluation', href: '/mains/evaluation' },
  { id: 'semantic-search', label: 'Semantic Search', href: '/search' },
  { id: 'strategy', label: 'Strategy Engine', href: '/strategy' },
  { id: 'shortcuts', label: 'Keyboard Shortcuts Guide', href: '/shortcuts' },
  { id: 'second-brain', label: 'Second Brain', href: '/second-brain' },
  { id: 'admin-review', label: 'Admin Review', href: '/admin/review' },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Search and Command Palette"
        onClick={() => setOpen(true)}
        className="flex w-full max-w-64 items-center gap-2 rounded-md border border-input bg-card px-3 py-2 text-sm text-muted-foreground transition-all duration-200 ease-in-out hover:border-border hover:shadow-sm hover:text-foreground active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="truncate">Search...</span> <span className="ml-auto flex h-5 items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">⌘K</span>
      </button>
      {open ? (
        <div 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="command-palette-title"
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-24" 
          onClick={() => setOpen(false)}
        >
          <h2 id="command-palette-title" className="sr-only">Search Command Palette</h2>
          <Command className="w-full max-w-xl overflow-hidden rounded-lg border border-border bg-background" onClick={(event) => event.stopPropagation()}>
            <Command.Input className="h-12 w-full border-b border-border bg-background px-4 text-sm outline-none" placeholder="Type a command or search..." />
            <Command.List className="max-h-72 overflow-y-auto p-2">
              <Command.Empty className="p-4 text-sm text-muted-foreground">No results found.</Command.Empty>
              <Command.Group heading="Navigate" className="text-sm">
                {commandItems.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.label}
                    onSelect={() => {
                      router.push(item.href);
                      setOpen(false);
                    }}
                    className="cursor-pointer rounded px-3 py-2 data-[selected=true]:bg-muted"
                  >
                    {item.label}
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </div>
      ) : null}
    </>
  );
}
