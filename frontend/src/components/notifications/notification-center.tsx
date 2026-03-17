'use client';

import { Bell } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';

type Reminder = {
  id: string;
  title: string;
  message: string;
};

const defaultReminders: Reminder[] = [
  { id: 'revision', title: 'Revision reminder', message: '3 topics dropping retention!' },
  { id: 'practice', title: 'Daily practice reminder', message: "Today's practice is ready in SyllabusFlow." },
  { id: 'mains-gate', title: 'Mains gate status', message: 'Complete 5 more MCQs to unlock Mains.' },
  { id: 'daily-plan', title: 'Daily plan reminder', message: 'Your strategy plan has 4 pending tasks for today.' },
  { id: 'streak', title: 'Streak alert', message: 'Your revision + practice streak is at risk today.' },
  { id: 'content', title: 'New content alert', message: 'A fresh current-affairs compilation is available.' },
  { id: 'essay', title: 'Weekly essay reminder', message: 'Your weekly essay prompt is live now.' },
];

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);

  const unread = useMemo(() => defaultReminders.filter((item) => !readIds.includes(item.id)), [readIds]);

  return (
    <div className="relative">
      <Button type="button" variant="outline" className="relative h-9 w-9 p-0" onClick={() => setOpen((value) => !value)}>
        <Bell className="h-4 w-4" />
        {unread.length > 0 ? (
          <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
            {unread.length}
          </span>
        ) : null}
      </Button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-md border border-border bg-card p-3 shadow-lg">
          <p className="text-sm font-semibold">Notifications</p>
          <ul className="mt-2 max-h-80 space-y-2 overflow-y-auto text-sm">
            {defaultReminders.map((reminder) => {
              const read = readIds.includes(reminder.id);
              return (
                <li key={reminder.id} className={`rounded border p-2 ${read ? 'opacity-60' : ''}`}>
                  <p className="font-medium">{reminder.title}</p>
                  <p className="text-muted-foreground">{reminder.message}</p>
                  {!read ? (
                    <button
                      type="button"
                      className="mt-1 text-xs text-primary hover:underline"
                      onClick={() => setReadIds((value) => [...value, reminder.id])}
                    >
                      Mark as read
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
