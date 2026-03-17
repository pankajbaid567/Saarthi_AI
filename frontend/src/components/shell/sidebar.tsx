'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const subjectTree = [
  {
    id: 'biology',
    name: 'Biology',
    topics: [
      { id: 'cell-biology', name: 'Cell Biology' },
      { id: 'genetics', name: 'Genetics' },
    ],
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    topics: [
      { id: 'organic-chemistry', name: 'Organic Chemistry' },
      { id: 'electrochemistry', name: 'Electrochemistry' },
    ],
  },
];

export function Sidebar() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ biology: true });

  return (
    <aside className="w-full border-r border-border bg-card p-4 md:w-72">
      <div className="mb-4 text-lg font-semibold">Saarthi AI</div>
      <nav className="space-y-2">
        <Link href="/dashboard" className="block rounded px-2 py-1.5 hover:bg-muted">
          Dashboard
        </Link>
        <Link href="/subjects" className="block rounded px-2 py-1.5 hover:bg-muted">
          Subjects
        </Link>
      </nav>
      <div className="mt-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject tree</p>
        <div className="space-y-1">
          {subjectTree.map((subject) => {
            const isOpen = expanded[subject.id];
            return (
              <div key={subject.id}>
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => ({ ...prev, [subject.id]: !prev[subject.id] }))}
                  className="flex w-full items-center gap-1 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                >
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className="flex-1">{subject.name}</span>
                </button>
                {isOpen ? (
                  <ul className="ml-6 space-y-1 py-1">
                    {subject.topics.map((topic) => (
                      <li key={topic.id}>
                        <Link href={`/topics/${topic.id}`} className="block rounded px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                          {topic.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
