'use client';

import { Command } from 'cmdk';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const commandItems = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { id: 'subjects', label: 'Subjects', href: '/subjects' },
  { id: 'syllabus-flow', label: 'SyllabusFlow', href: '/syllabus-flow' },
  { id: 'topic-biology', label: 'Cell Biology Topic', href: '/topics/cell-biology' },
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
        onClick={() => setOpen(true)}
        className="flex w-full max-w-64 items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground"
      >
        <Search className="h-4 w-4" />
        Search... <span className="ml-auto text-xs">⌘K</span>
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-24" onClick={() => setOpen(false)}>
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
