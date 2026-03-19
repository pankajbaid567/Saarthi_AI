'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { knowledgeApi, type SubjectResponse, type TopicResponse } from '@/lib/api-client';

const PAPER_LABELS: Record<string, string> = {
  PRE_GS1: 'Prelims GS1',
  PRE_GS2: 'Prelims CSAT',
  MAINS_ESSAY: 'Mains Essay',
  MAINS_GS1: 'Mains GS1',
  MAINS_GS2: 'Mains GS2',
  MAINS_GS3: 'Mains GS3',
  MAINS_GS4: 'Mains GS4',
};

const PAPER_ORDER = ['PRE_GS1', 'PRE_GS2', 'MAINS_ESSAY', 'MAINS_GS1', 'MAINS_GS2', 'MAINS_GS3', 'MAINS_GS4'];

type SubjectWithTopics = SubjectResponse & { topics: TopicResponse[] };

export function Sidebar() {
  const [papers, setPapers] = useState<Map<string, SubjectWithTopics[]>>(new Map());
  const [expandedPapers, setExpandedPapers] = useState<Record<string, boolean>>({});
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const subjectsRes = await knowledgeApi.getSubjects();
        const subjects: SubjectResponse[] = subjectsRes.data;

        // Fetch topics for all subjects in parallel
        const topicsResults = await Promise.all(
          subjects.map(async (s) => {
            try {
              const res = await knowledgeApi.getSubjectTopics(s.id);
              return { subjectId: s.id, topics: res.data };
            } catch {
              return { subjectId: s.id, topics: [] as TopicResponse[] };
            }
          }),
        );

        const topicsBySubject = new Map<string, TopicResponse[]>();
        for (const result of topicsResults) {
          topicsBySubject.set(result.subjectId, result.topics);
        }

        // Group by paper
        const grouped = new Map<string, SubjectWithTopics[]>();
        for (const subject of subjects) {
          const paper = subject.paper ?? 'OTHER';
          if (!grouped.has(paper)) {
            grouped.set(paper, []);
          }
          grouped.get(paper)!.push({
            ...subject,
            topics: topicsBySubject.get(subject.id) ?? [],
          });
        }

        if (active) {
          setPapers(grouped);
        }
      } catch {
        // Silently fail - sidebar just won't show subjects
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const togglePaper = (paper: string) => {
    setExpandedPapers((prev) => ({ ...prev, [paper]: !prev[paper] }));
  };

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects((prev) => ({ ...prev, [subjectId]: !prev[subjectId] }));
  };

  const sortedPapers = [...papers.keys()].sort((a, b) => {
    const ai = PAPER_ORDER.indexOf(a);
    const bi = PAPER_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return (
    <aside className="w-full border-r border-border bg-card p-4 md:w-72 overflow-y-auto">
      <div className="mb-4 text-lg font-semibold">Saarthi AI</div>
      <nav className="space-y-2">
        <Link href="/dashboard" className="block rounded px-2 py-1.5 hover:bg-muted">
          Dashboard
        </Link>
        <Link href="/subjects" className="block rounded px-2 py-1.5 hover:bg-muted">
          Subjects
        </Link>
        <Link href="/tests/generate" className="block rounded px-2 py-1.5 hover:bg-muted">
          Generate Test
        </Link>
        <Link href="/tests/history" className="block rounded px-2 py-1.5 hover:bg-muted">
          Test History
        </Link>
        <Link href="/syllabus-flow" className="block rounded px-2 py-1.5 hover:bg-muted">
          SyllabusFlow
        </Link>
        <Link href="/mains" className="block rounded px-2 py-1.5 hover:bg-muted">
          Mains Practice
        </Link>
        <Link href="/mains/evaluation" className="block rounded px-2 py-1.5 hover:bg-muted">
          Mains Evaluation
        </Link>
        <Link href="/chat" className="block rounded px-2 py-1.5 hover:bg-muted">
          Quiz Chat
        </Link>
        <Link href="/strategy" className="block rounded px-2 py-1.5 hover:bg-muted">
          Strategy
        </Link>
        <Link href="/shortcuts" className="block rounded px-2 py-1.5 hover:bg-muted">
          Shortcuts Guide
        </Link>
        <Link href="/second-brain" className="block rounded px-2 py-1.5 hover:bg-muted">
          Second Brain
        </Link>
        <Link href="/admin/review" className="block rounded px-2 py-1.5 hover:bg-muted">
          Admin Review
        </Link>
      </nav>
      <div className="mt-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Syllabus tree</p>
        {loading ? (
          <p className="px-2 text-xs text-muted-foreground">Loading...</p>
        ) : (
          <div className="space-y-0.5">
            {sortedPapers.map((paper) => {
              const paperSubjects = papers.get(paper) ?? [];
              const isPaperOpen = expandedPapers[paper];
              return (
                <div key={paper}>
                  {/* Paper level */}
                  <button
                    type="button"
                    onClick={() => togglePaper(paper)}
                    className="flex w-full items-center gap-1 rounded px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide hover:bg-muted"
                  >
                    {isPaperOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    <span className="flex-1 truncate">{PAPER_LABELS[paper] ?? paper}</span>
                  </button>
                  {isPaperOpen && (
                    <div className="ml-2 space-y-0.5">
                      {paperSubjects.map((subject) => {
                        const isSubjectOpen = expandedSubjects[subject.id];
                        const rootTopics = subject.topics.filter((t) => t.parentTopicId === null);
                        return (
                          <div key={subject.id}>
                            {/* Subject level */}
                            <button
                              type="button"
                              onClick={() => toggleSubject(subject.id)}
                              className="flex w-full items-center gap-1 rounded px-2 py-1 text-left text-sm hover:bg-muted"
                            >
                              {isSubjectOpen ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                              <Link
                                href={`/subjects/${subject.id}`}
                                className="flex-1 truncate hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {subject.name}
                              </Link>
                            </button>
                            {isSubjectOpen && rootTopics.length > 0 && (
                              <ul className="ml-6 space-y-0.5 py-0.5">
                                {rootTopics.map((topic) => (
                                  <li key={topic.id}>
                                    <Link
                                      href={`/topics/${topic.id}`}
                                      className="block truncate rounded px-2 py-0.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                                    >
                                      {topic.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
