'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { chatApi, type ChatMode } from '@/lib/chat-api';
import { useChatStore } from '@/stores/chat-store';

const modes: Array<{ value: ChatMode; label: string }> = [
  { value: 'rapid_fire', label: 'Rapid Fire' },
  { value: 'deep_concept', label: 'Deep Concept' },
  { value: 'elimination_training', label: 'Elimination Training' },
  { value: 'trap_questions', label: 'Trap Questions' },
];

const formatMode = (mode: ChatMode): string => mode.replaceAll('_', ' ');

export default function ChatPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const { selectedMode, selectedSubject, selectedTopic, sessions, setMode, setSubject, setTopic, setSessions } =
    useChatStore();

  useEffect(() => {
    void (async () => {
      try {
        const response = await chatApi.listSessions(8);
        setSessions(response.data);
      } catch {
        setSessions([]);
      }
    })();
  }, [setSessions]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const response = await chatApi.createSession({
        mode: selectedMode,
        subject: selectedSubject,
        topic: selectedTopic,
      });
      router.push(`/chat/${response.data.id}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Quiz Chat</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="block text-sm font-medium">Mode</label>
          <select className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" value={selectedMode} onChange={(event) => setMode(event.target.value as ChatMode)}>
            {modes.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>

          <label className="block text-sm font-medium">Subject</label>
          <Input value={selectedSubject} onChange={(event) => setSubject(event.target.value)} placeholder="e.g. Polity" />

          <label className="block text-sm font-medium">Topic</label>
          <Input value={selectedTopic} onChange={(event) => setTopic(event.target.value)} placeholder="e.g. Federalism" />

          <Button onClick={handleCreate} disabled={creating || !selectedTopic.trim()}>
            {creating ? 'Creating...' : 'Start Chat Session'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {sessions.length === 0 ? <p className="text-muted-foreground">No sessions yet.</p> : null}
          {sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              className="w-full rounded border border-border p-2 text-left hover:bg-muted"
              onClick={() => router.push(`/chat/${session.id}`)}
            >
              <p className="font-medium">{session.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatMode(session.mode)} · {session.topic}
              </p>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
