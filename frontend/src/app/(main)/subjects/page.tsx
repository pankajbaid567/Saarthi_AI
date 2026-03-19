'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { knowledgeApi, type SubjectResponse } from '@/lib/api-client';

const PAPER_LABELS: Record<string, string> = {
  PRE_GS1: 'Prelims - General Studies I',
  PRE_GS2: 'Prelims - CSAT (Paper II)',
  MAINS_ESSAY: 'Mains - Essay (Paper I)',
  MAINS_GS1: 'Mains - General Studies I',
  MAINS_GS2: 'Mains - General Studies II',
  MAINS_GS3: 'Mains - General Studies III',
  MAINS_GS4: 'Mains - General Studies IV (Ethics)',
};

const PAPER_ORDER = ['PRE_GS1', 'PRE_GS2', 'MAINS_ESSAY', 'MAINS_GS1', 'MAINS_GS2', 'MAINS_GS3', 'MAINS_GS4'];

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsedPapers, setCollapsedPapers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await knowledgeApi.getSubjects();
        if (active) {
          setSubjects(response.data);
          setError(null);
        }
      } catch {
        if (active) {
          setError('Unable to load subjects. Please ensure backend is running.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading subjects...</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  // Group subjects by paper
  const grouped = new Map<string, SubjectResponse[]>();
  for (const subject of subjects) {
    const paper = subject.paper ?? 'OTHER';
    if (!grouped.has(paper)) {
      grouped.set(paper, []);
    }
    grouped.get(paper)!.push(subject);
  }

  // Sort papers by defined order
  const sortedPapers = [...grouped.keys()].sort((a, b) => {
    const ai = PAPER_ORDER.indexOf(a);
    const bi = PAPER_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  const togglePaper = (paper: string) => {
    setCollapsedPapers((prev) => ({ ...prev, [paper]: !prev[paper] }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">UPSC Syllabus</h1>
      {sortedPapers.map((paper) => {
        const paperSubjects = grouped.get(paper) ?? [];
        const isCollapsed = collapsedPapers[paper];
        return (
          <section key={paper}>
            <button
              type="button"
              onClick={() => togglePaper(paper)}
              className="mb-3 flex w-full items-center gap-2 text-left"
            >
              <span className="text-lg font-semibold">{PAPER_LABELS[paper] ?? paper}</span>
              <span className="text-xs text-muted-foreground">
                ({paperSubjects.length} subject{paperSubjects.length !== 1 ? 's' : ''})
              </span>
              <span className="ml-auto text-sm text-muted-foreground">{isCollapsed ? '+' : '-'}</span>
            </button>
            {!isCollapsed && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paperSubjects.map((subject) => (
                  <Link key={subject.id} href={`/subjects/${subject.id}`}>
                    <Card className="h-full transition hover:border-primary">
                      <CardHeader>
                        <CardTitle>{subject.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{subject.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
