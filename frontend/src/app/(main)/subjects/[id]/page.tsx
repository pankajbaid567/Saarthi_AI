'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { knowledgeApi, type SubjectResponse, type TopicResponse } from '@/lib/api-client';

export default function SubjectDetailPage() {
  const params = useParams<{ id: string }>();
  const [subject, setSubject] = useState<SubjectResponse | null>(null);
  const [topics, setTopics] = useState<TopicResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [subjectRes, topicsRes] = await Promise.all([
          knowledgeApi.getSubject(params.id),
          knowledgeApi.getSubjectTopics(params.id),
        ]);
        if (active) {
          setSubject(subjectRes.data);
          setTopics(topicsRes.data);
          setError(null);
        }
      } catch {
        if (active) {
          setError('Unable to load subject details. Please ensure backend is running.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => { active = false; };
  }, [params.id]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  // Separate root topics (no parent) and subtopics
  const rootTopics = topics.filter((t) => t.parentTopicId === null);
  const subtopicMap = new Map<string, TopicResponse[]>();
  for (const topic of topics) {
    if (topic.parentTopicId) {
      if (!subtopicMap.has(topic.parentTopicId)) {
        subtopicMap.set(topic.parentTopicId, []);
      }
      subtopicMap.get(topic.parentTopicId)!.push(topic);
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">{subject?.name ?? params.id}</h1>
      {subject?.paper && (
        <p className="mb-4 text-sm text-muted-foreground">{subject.paper.replace(/_/g, ' ')}</p>
      )}
      <div className="space-y-4">
        {rootTopics.map((topic) => {
          const children = subtopicMap.get(topic.id) ?? [];
          return (
            <Card key={topic.id}>
              <CardHeader>
                <Link href={`/topics/${topic.id}`}>
                  <CardTitle className="transition hover:text-primary">{topic.name}</CardTitle>
                </Link>
                {topic.description && (
                  <p className="text-sm text-muted-foreground">{topic.description}</p>
                )}
              </CardHeader>
              {children.length > 0 && (
                <CardContent>
                  <ul className="space-y-1">
                    {children.map((sub) => (
                      <li key={sub.id}>
                        <Link
                          href={`/topics/${sub.id}`}
                          className="text-sm text-muted-foreground transition hover:text-foreground"
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
