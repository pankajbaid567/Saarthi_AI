'use client';

import { useEffect, useState } from 'react';

import { secondBrainApi, type SecondBrainEntry } from '@/lib/api-client';

export default function SecondBrainPage() {
  const [entries, setEntries] = useState<SecondBrainEntry[]>([]);
  const [connections, setConnections] = useState<Array<{ fromTag: string; toTag: string; strength: number }>>([]);
  const [insights, setInsights] = useState<Array<{ id: string; insight: string; relatedTags: string[] }>>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = async (search?: string) => {
    setError(null);
    try {
      const [entriesResponse, connectionsResponse, insightsResponse] = await Promise.all([
        secondBrainApi.listEntries(search ? { q: search } : undefined),
        secondBrainApi.getConnections(),
        secondBrainApi.getAutoInsights(),
      ]);
      setEntries(entriesResponse.data);
      setConnections(connectionsResponse.data);
      setInsights(insightsResponse.data);
    } catch {
      setError('Unable to load second brain data. Please login and try again.');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async () => {
    if (!title.trim() || !content.trim()) {
      return;
    }

    try {
      await secondBrainApi.createEntry({
        title: title.trim(),
        content: content.trim(),
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      setTitle('');
      setContent('');
      setTags('');
      await load(query);
    } catch {
      setError('Unable to create entry.');
    }
  };

  const remove = async (id: string) => {
    try {
      await secondBrainApi.deleteEntry(id);
      await load(query);
    } catch {
      setError('Unable to delete entry.');
    }
  };

  const edit = async (entry: SecondBrainEntry) => {
    const nextTitle = window.prompt('Edit title', entry.title);
    if (!nextTitle) {
      return;
    }
    const nextContent = window.prompt('Edit content', entry.content);
    if (!nextContent) {
      return;
    }

    try {
      await secondBrainApi.updateEntry(entry.id, { title: nextTitle, content: nextContent });
      await load(query);
    } catch {
      setError('Unable to update entry.');
    }
  };

  return (
    <main className="space-y-6 p-4 md:p-6">
      <section>
        <h1 className="text-2xl font-semibold">Second Brain</h1>
        <p className="text-sm text-muted-foreground">Capture insights, connect topics, and review auto-generated cross-topic patterns.</p>
      </section>

      {error ? <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}

      <section className="rounded-lg border border-border bg-card p-4">
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
            className="md:col-span-2 min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm"
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
            <button type="button" onClick={() => void load(query)} className="rounded border border-border px-3 py-1.5 text-sm">
              Search
            </button>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {entries.map((entry) => (
            <article key={entry.id} className="rounded-md border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{entry.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{entry.content}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {entry.tags.map((tag) => (
                      <span key={`${entry.id}-${tag}`} className="rounded bg-muted px-2 py-0.5 text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button type="button" onClick={() => void edit(entry)} className="rounded border border-border px-2 py-1 text-xs">
                    Edit
                  </button>
                  <button type="button" onClick={() => void remove(entry.id)} className="rounded border border-border px-2 py-1 text-xs">
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
          {entries.length === 0 ? <p className="text-sm text-muted-foreground">No entries found.</p> : null}
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
            {connections.length === 0 ? <li className="text-muted-foreground">No connections yet.</li> : null}
          </ul>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-base font-semibold">Auto-generated insights</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {insights.map((insight) => (
              <li key={insight.id} className="rounded-md border border-border p-2">
                <p>{insight.insight}</p>
                <p className="mt-1 text-xs text-muted-foreground">{insight.relatedTags.map((tag) => `#${tag}`).join(' ')}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
