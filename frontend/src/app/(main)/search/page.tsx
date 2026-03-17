'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { learningApi, type LearningSearchResult } from '@/lib/learning-api';

const escapeHtml = (value: string): string =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const highlightQuery = (text: string, query: string): string => {
  if (!query.trim()) {
    return escapeHtml(text);
  }

  const escaped = query.trim().replace(/[.*+?^${}()|[\\[\\]]/g, '\\$&');
  return escapeHtml(text).replace(new RegExp(`(${escaped})`, 'ig'), '<mark>$1</mark>');
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LearningSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const facets = useMemo(() => {
    const uniqueTypes = [...new Set(results.map((result) => result.type))].sort();
    const uniqueSubjects = [...new Set(results.map((result) => result.subject))].sort();
    const uniqueTopics = [...new Set(results.map((result) => result.topic))].sort();
    return { uniqueTypes, uniqueSubjects, uniqueTopics };
  }, [results]);

  const runSearch = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await learningApi.searchContent({
        q: query,
        ...(typeFilter ? { type: typeFilter } : {}),
        ...(subjectFilter ? { subject: subjectFilter } : {}),
        ...(topicFilter ? { topic: topicFilter } : {}),
      });
      const payload = response.data;
      setResults(Array.isArray(payload) ? payload : payload.results);
    } catch {
      setError('Unable to fetch semantic search results right now.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Semantic Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form className="grid gap-2 md:grid-cols-[1fr_auto]" onSubmit={runSearch}>
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes, PYQs, and concepts..." />
            <Button type="submit" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </form>

          <div className="grid gap-2 sm:grid-cols-3">
            <select className="h-10 rounded-md border border-border bg-background px-3 text-sm" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="">All types</option>
              {facets.uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select className="h-10 rounded-md border border-border bg-background px-3 text-sm" value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}>
              <option value="">All subjects</option>
              {facets.uniqueSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
            <select className="h-10 rounded-md border border-border bg-background px-3 text-sm" value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)}>
              <option value="">All topics</option>
              {facets.uniqueTopics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <div className="space-y-2">
        {results.map((result) => (
          <Card key={result.id}>
            <CardContent className="space-y-2 p-4">
              <p className="text-xs text-muted-foreground">
                {result.subject} · {result.topic} · {result.type} · score {result.score.toFixed(2)}
              </p>
              <h3 className="font-semibold">{result.title ?? 'Untitled'}</h3>
              <p
                className="text-sm text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: highlightQuery(result.snippet, query) }}
              />
            </CardContent>
          </Card>
        ))}
        {!loading && query && results.length === 0 && !error ? (
          <p className="text-sm text-muted-foreground">No matching semantic results found.</p>
        ) : null}
      </div>
    </div>
  );
}
