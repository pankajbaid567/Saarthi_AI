'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import { secondBrainApi, type SecondBrainEntry } from '@/lib/api-client';

export default function SecondBrainPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingContent, setEditingContent] = useState('');

  const entriesQuery = useQuery({
    queryKey: ['second-brain', 'entries', query],
    queryFn: async () => (await secondBrainApi.listEntries(query ? { q: query } : undefined)).data,
  });

  const connectionsQuery = useQuery({
    queryKey: ['second-brain', 'connections'],
    queryFn: async () => (await secondBrainApi.getConnections()).data,
  });

  const insightsQuery = useQuery({
    queryKey: ['second-brain', 'insights'],
    queryFn: async () => (await secondBrainApi.getAutoInsights()).data,
  });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['second-brain', 'entries'] }),
      queryClient.invalidateQueries({ queryKey: ['second-brain', 'connections'] }),
      queryClient.invalidateQueries({ queryKey: ['second-brain', 'insights'] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: async () =>
      secondBrainApi.createEntry({
        title: title.trim(),
        content: content.trim(),
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      }),
    onSuccess: async () => {
      setTitle('');
      setContent('');
      setTags('');
      setError(null);
      await refresh();
    },
    onError: () => setError('Unable to create entry.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => secondBrainApi.deleteEntry(id),
    onSuccess: async () => {
      setError(null);
      await refresh();
    },
    onError: () => setError('Unable to delete entry.'),
  });

  const editMutation = useMutation({
    mutationFn: async ({ entry, nextTitle, nextContent }: { entry: SecondBrainEntry; nextTitle: string; nextContent: string }) =>
      secondBrainApi.updateEntry(entry.id, { title: nextTitle, content: nextContent }),
    onSuccess: async () => {
      setError(null);
      await refresh();
    },
    onError: () => setError('Unable to update entry.'),
  });

  const submit = () => {
    if (!title.trim() || !content.trim()) {
      return;
    }
    createMutation.mutate();
  };

  const beginEdit = (entry: SecondBrainEntry) => {
    setEditingEntryId(entry.id);
    setEditingTitle(entry.title);
    setEditingContent(entry.content);
  };

  const saveEdit = (entry: SecondBrainEntry) => {
    if (!editingTitle.trim() || !editingContent.trim()) {
      return;
    }

    editMutation.mutate({ entry, nextTitle: editingTitle.trim(), nextContent: editingContent.trim() });
    setEditingEntryId(null);
  };

  const entries = entriesQuery.data ?? [];
  const connections = connectionsQuery.data ?? [];
  const insights = insightsQuery.data ?? [];

  return (
    <main id="top" className="space-y-6 p-4 md:p-6">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold">Second Brain</h1>
          <button type="button" onClick={() => window.print()} className="no-print rounded border border-border px-3 py-1.5 text-sm">
            Print notes
          </button>
        </div>
        <p className="text-sm text-muted-foreground">Capture insights, connect topics, and review auto-generated cross-topic patterns.</p>
      </section>

      {error ? <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}

      <section id="create-insight" className="printable-notes rounded-lg border border-border bg-card p-4">
        <h2 className="text-lg font-semibold">Create insight</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Entry title"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="Tags (comma separated)"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write your cross-topic insight..."
            className="min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm md:col-span-2"
          />
        </div>
        <button type="button" onClick={submit} className="mt-3 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">
          Save entry
        </button>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Entries</h2>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search insights"
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            />
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {entries.map((entry) => (
            <article key={entry.id} className="rounded-md border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  {editingEntryId === entry.id ? (
                    <div className="space-y-2">
                      <input
                        value={editingTitle}
                        onChange={(event) => setEditingTitle(event.target.value)}
                        className="w-full rounded border border-border bg-background px-2 py-1 text-sm"
                      />
                      <textarea
                        value={editingContent}
                        onChange={(event) => setEditingContent(event.target.value)}
                        className="min-h-20 w-full rounded border border-border bg-background px-2 py-1 text-sm"
                      />
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium">{entry.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{entry.content}</p>
                    </>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {entry.tags.map((tag) => (
                      <span key={`${entry.id}-${tag}`} className="rounded bg-muted px-2 py-0.5 text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1">
                  {editingEntryId === entry.id ? (
                    <>
                      <button type="button" onClick={() => saveEdit(entry)} className="rounded border border-border px-2 py-1 text-xs">
                        Save
                      </button>
                      <button type="button" onClick={() => setEditingEntryId(null)} className="rounded border border-border px-2 py-1 text-xs">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => beginEdit(entry)} className="rounded border border-border px-2 py-1 text-xs">
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(entry.id)}
                    className="rounded border border-border px-2 py-1 text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
          {entries.length === 0 ? (
            <EmptyState
              title="No entries found"
              description="Capture your first insight to build long-term memory links."
              ctaLabel="Create one now"
              ctaHref="#create-insight"
            />
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-base font-semibold">Cross-topic connections</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {connections.map((connection) => (
              <li key={`${connection.fromTag}-${connection.toTag}`}>
                {connection.fromTag} ↔ {connection.toTag} <span className="text-muted-foreground">({connection.strength})</span>
              </li>
            ))}
            {connections.length === 0 ? (
              <li>
                <EmptyState title="No connections yet" description="Add tagged entries so Saarthi can auto-link your topics." ctaLabel="Create an entry" ctaHref="#create-insight" />
              </li>
            ) : null}
          </ul>
        </div>

        <div className="printable-notes rounded-lg border border-border bg-card p-4">
          <h3 className="text-base font-semibold">Auto-generated insights</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {insights.map((insight) => (
              <li key={insight.id} className="rounded-md border border-border p-2">
                <p>{insight.insight}</p>
                <p className="mt-1 text-xs text-muted-foreground">{insight.relatedTags.map((tag) => `#${tag}`).join(' ')}</p>
              </li>
            ))}
            {insights.length === 0 ? (
              <li>
                <EmptyState title="No insights yet" description="Study more topics and save notes to unlock AI-generated insight suggestions." />
              </li>
            ) : null}
          </ul>
        </div>
      </section>
    </main>
  );
}
