'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { knowledgeApi, mainsApi, type MainsQuestion } from '@/lib/api-client';

type Subject = { id: string; name: string };
type Topic = { id: string; name: string };

const typeOptions: Array<{ label: string; value: '' | MainsQuestion['type'] }> = [
  { label: 'All types', value: '' },
  { label: 'GS', value: 'gs' },
  { label: 'Essay', value: 'essay' },
  { label: 'Ethics', value: 'ethics' },
  { label: 'Optional', value: 'optional' },
];

const sourceOptions: Array<{ label: string; value: '' | MainsQuestion['source'] }> = [
  { label: 'All sources', value: '' },
  { label: 'PYQ', value: 'pyq' },
  { label: 'Coaching', value: 'coaching' },
  { label: 'AI Generated', value: 'ai_generated' },
];

export default function MainsQuestionsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicId, setTopicId] = useState('');
  const [type, setType] = useState<'' | MainsQuestion['type']>('');
  const [source, setSource] = useState<'' | MainsQuestion['source']>('');
  const [marks, setMarks] = useState('');
  const [search, setSearch] = useState('');
  const [questions, setQuestions] = useState<MainsQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const response = await knowledgeApi.getSubjects();
        const nextSubjects = response.data as Subject[];
        setSubjects(nextSubjects);
        setSubjectId(nextSubjects[0]?.id ?? '');
      } catch {
        setError('Unable to load subjects');
      }
    };

    void loadSubjects();
  }, []);

  useEffect(() => {
    if (!subjectId) {
      setTopics([]);
      setTopicId('');
      return;
    }

    const loadTopics = async () => {
      try {
        const response = await knowledgeApi.getSubjectTopics(subjectId);
        const nextTopics = response.data as Topic[];
        setTopics(nextTopics);
      } catch {
        setError('Unable to load topics');
      }
    };

    void loadTopics();
  }, [subjectId]);

  const normalizedMarks = useMemo(() => {
    const parsedMarks = Number(marks);
    if (Number.isNaN(parsedMarks) || parsedMarks <= 0) {
      return undefined;
    }
    return parsedMarks;
  }, [marks]);

  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await mainsApi.listQuestions({
          topicId: topicId || undefined,
          type: type || undefined,
          source: source || undefined,
          marks: normalizedMarks,
          search: search.trim() || undefined,
          limit: 50,
          offset: 0,
        });
        setQuestions(response.data.items);
      } catch {
        setError('Unable to load mains questions');
      } finally {
        setLoading(false);
      }
    };

    void loadQuestions();
  }, [normalizedMarks, search, source, topicId, type]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Mains Question Bank</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          <select value={topicId} onChange={(event) => setTopicId(event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
            <option value="">All topics</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
          <Input value={marks} onChange={(event) => setMarks(event.target.value)} placeholder="Marks (e.g. 10)" />
          <select value={type} onChange={(event) => setType(event.target.value as '' | MainsQuestion['type'])} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
            {typeOptions.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select value={source} onChange={(event) => setSource(event.target.value as '' | MainsQuestion['source'])} className="h-10 rounded-md border border-border bg-background px-3 text-sm">
            {sourceOptions.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search question text" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-muted-foreground">Loading questions...</p> : null}
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          {!loading && !error && questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No questions match your filters.</p>
          ) : null}
          {questions.map((question) => (
            <Link key={question.id} href={`/mains/${question.id}`} className="block rounded-md border border-border p-3 transition hover:bg-muted">
              <p className="text-sm font-medium">{question.questionText}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {question.type.toUpperCase()} • {question.source.replace('_', ' ')} • {question.marks} marks •
                Suggested {question.suggestedWordLimit} words
              </p>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
