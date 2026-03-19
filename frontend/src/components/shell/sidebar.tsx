'use client';

import { 
  ChevronRight, LayoutDashboard, BookOpen, FileText, 
  History, GitMerge, PenTool, CheckSquare, MessageSquare, 
  Target, Command, BrainCircuit, Shield, PanelLeftClose, PanelLeft, Bot
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { knowledgeApi, type SubjectResponse, type TopicResponse } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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

const STATIC_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/subjects', label: 'Subjects', icon: BookOpen },
  { href: '/tests/generate', label: 'Generate Test', icon: FileText },
  { href: '/tests/history', label: 'Test History', icon: History },
  { href: '/syllabus-flow', label: 'Syllabus Flow', icon: GitMerge },
  { href: '/mains', label: 'Mains Practice', icon: PenTool },
  { href: '/mains/evaluation', label: 'Mains Evaluation', icon: CheckSquare },
  { href: '/chat', label: 'Quiz Chat', icon: MessageSquare },
  { href: '/strategy', label: 'Strategy', icon: Target },
  { href: '/shortcuts', label: 'Shortcuts Guide', icon: Command },
  { href: '/second-brain', label: 'Second Brain', icon: BrainCircuit },
  { href: '/admin/review', label: 'Admin Review', icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
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

        const topicsResults = await Promise.all(
          subjects.map(async (s) => {
            try {
              const res = await knowledgeApi.getSubjectTopics(s.id);
              return { subjectId: s.id, topics: res.data };
            } catch {
              return { subjectId: s.id, topics: [] as TopicResponse[] };
            }
          })
        );

        const topicsBySubject = new Map<string, TopicResponse[]>();
        for (const result of topicsResults) {
          topicsBySubject.set(result.subjectId, result.topics);
        }

        const grouped = new Map<string, SubjectWithTopics[]>();
        for (const subject of subjects) {
          const paper = subject.paper ?? 'OTHER';
          if (!grouped.has(paper)) grouped.set(paper, []);
          grouped.get(paper)!.push({
            ...subject,
            topics: topicsBySubject.get(subject.id) ?? [],
          });
        }

        if (active) setPapers(grouped);
      } catch {
        // Silently fail
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const togglePaper = (paper: string) => setExpandedPapers((prev) => ({ ...prev, [paper]: !prev[paper] }));
  const toggleSubject = (subjectId: string) => setExpandedSubjects((prev) => ({ ...prev, [subjectId]: !prev[subjectId] }));

  const sortedPapers = [...papers.keys()].sort((a, b) => {
    const ai = PAPER_ORDER.indexOf(a);
    const bi = PAPER_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return (
    <aside className={cn(
      "h-full border-r border-border bg-background transition-all duration-300 flex flex-col relative z-20",
      isCollapsed ? "w-16 md:w-[4.5rem]" : "w-64 md:w-72"
    )}>
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-4 w-full border-b border-border/40 shrink-0">
        <div className={cn("flex items-center gap-2 overflow-hidden transition-all duration-300", isCollapsed ? "w-0 opacity-0" : "w-full opacity-100")}>
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
            <Bot size={18} />
          </div>
          <span className="font-semibold tracking-tight truncate">Saarthi AI</span>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          className={cn("shrink-0 h-8 w-8 text-muted-foreground transition-all duration-200 ease-in-out hover:text-foreground hover:bg-muted active:scale-[0.98]", isCollapsed ? "mx-auto" : "")}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </Button>
      </div>

      {/* Main Navigation Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-6">
        
        <nav className="space-y-[2px]">
          {STATIC_LINKS.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            const Icon = link.icon;
            
            return (
              <Link 
                key={link.href} 
                href={link.href} 
                title={isCollapsed ? link.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out hover:scale-[1.01] active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-primary group",
                  isActive 
                    ? "bg-secondary text-secondary-foreground" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground line-clamp-1"
                )}
              >
                <Icon size={16} className={cn("shrink-0", isActive ? "text-primary/90" : "text-muted-foreground group-hover:text-foreground")} />
                {!isCollapsed && <span className="truncate">{link.label}</span>}
              </Link>
            )
          })}
        </nav>

        {!isCollapsed && (
          <div className="pt-2 border-t border-border/40">
            <p className="mb-3 px-3 mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Syllabus Tree
            </p>
            {loading ? (
              <div className="px-3 py-2 text-sm text-muted-foreground/50 animate-pulse">Loading modules...</div>
            ) : (
              <div className="space-y-1">
                {sortedPapers.map((paper) => {
                  const paperSubjects = papers.get(paper) ?? [];
                  const isPaperOpen = expandedPapers[paper];
                  return (
                    <div key={paper} className="mb-1">
                      <button
                        type="button"
                        onClick={() => togglePaper(paper)}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs font-medium text-foreground/80 hover:bg-muted/50 transition-colors"
                      >
                        <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 transition-transform text-muted-foreground", isPaperOpen && "rotate-90")} />
                        <span className="flex-1 truncate">{PAPER_LABELS[paper] ?? paper}</span>
                      </button>
                      {isPaperOpen && (
                        <div className="ml-3 pl-3 border-l border-border/50 space-y-1 mt-1">
                          {paperSubjects.map((subject) => {
                            const isSubjectOpen = expandedSubjects[subject.id];
                            const rootTopics = subject.topics.filter((t) => t.parentTopicId === null);
                            return (
                              <div key={subject.id}>
                                <div className="flex items-center group">
                                  <button
                                    type="button"
                                    onClick={() => toggleSubject(subject.id)}
                                    className="p-1 rounded hover:bg-muted text-muted-foreground"
                                  >
                                    <ChevronRight className={cn("h-3 w-3 transition-transform", isSubjectOpen && "rotate-90")} />
                                  </button>
                                  <Link
                                    href={`/subjects/${subject.id}`}
                                    className="flex-1 truncate px-2 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    {subject.name}
                                  </Link>
                                </div>
                                {isSubjectOpen && rootTopics.length > 0 && (
                                  <ul className="ml-4 pl-3 border-l border-border/30 space-y-1 py-1">
                                    {rootTopics.map((topic) => (
                                      <li key={topic.id}>
                                        <Link
                                          href={`/topics/${topic.id}`}
                                          className="block truncate rounded px-2 py-1 text-[13px] text-muted-foreground/80 hover:bg-muted/50 hover:text-foreground transition-colors"
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
        )}
      </div>
    </aside>
  );
}
