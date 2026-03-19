'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { essaysApi, knowledgeApi, mainsApi, practiceApi, type SubjectResponse } from '@/lib/api-client';

const statusClassMap: Record<string, string> = {
  completed: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  in_progress: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
  not_started: 'bg-slate-500/20 text-slate-700 dark:text-slate-300',
};

type FeedbackLoopResponse = {
  rollingWindowDays: number;
  topics: Array<{
    topicId: string;
    attemptedQuestions: number;
    accuracy: number;
    difficultyTierDelta: number;
    weakAreaWeightMultiplier: number;
    reason: string;
  }>;
};

type NonRepetitionStats = {
  windowDays: number;
  totalAttempts: number;
  uniqueQuestionCount: number;
  repeatAttempts: number;
  repetitionRate: number;
};

export default function SyllabusFlowPage() {
  const gateStatusQuery = useQuery({
    queryKey: ['mains', 'gate-status'],
    queryFn: async () => (await mainsApi.getGateStatus()).data,
  });

  const dailyQuestionQuery = useQuery({
    queryKey: ['mains', 'daily-question'],
    queryFn: async () => (await mainsApi.getDailyQuestion()).data?.question,
  });

  const weeklyEssayQuery = useQuery({
    queryKey: ['essays', 'weekly-question'],
    queryFn: async () => (await essaysApi.getWeeklyQuestion()).data?.prompt,
  });

  const feedbackLoopQuery = useQuery({
    queryKey: ['practice', 'feedback-loop'],
    queryFn: async () => (await practiceApi.getFeedbackLoop()).data as FeedbackLoopResponse,
  });

  const nonRepetitionQuery = useQuery({
    queryKey: ['practice', 'non-repetition'],
    queryFn: async () => (await practiceApi.getNonRepetitionStats()).data as NonRepetitionStats,
  });

  const syllabusTopicsQuery = useQuery({
    queryKey: ['knowledge', 'syllabus-topics'],
    queryFn: async () => {
      const subjects: SubjectResponse[] = (await knowledgeApi.getSubjects()).data;
      const topicPromises = subjects.slice(0, 5).map(async (subject) => {
        try {
          const topicsRes = await knowledgeApi.getSubjectTopics(subject.id);
          const rootTopics = topicsRes.data.filter((t) => t.parentTopicId === null).slice(0, 3);
          return rootTopics.map((t) => ({
            id: t.id,
            name: `${subject.name}: ${t.name}`,
            status: 'not_started' as const,
            completion: 0,
          }));
        } catch {
          return [];
        }
      });
      const nestedTopicsArrays = await Promise.all(topicPromises);
      return nestedTopicsArrays.flat().slice(0, 10);
    },
  });

  const isAnyError = [
    gateStatusQuery.isError,
    dailyQuestionQuery.isError,
    weeklyEssayQuery.isError,
    feedbackLoopQuery.isError,
    nonRepetitionQuery.isError,
    syllabusTopicsQuery.isError
  ].some(Boolean);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">SyllabusFlow AI</h1>
      {isAnyError ? (
        <p className="text-sm text-destructive">
          Some data failed to load. Please ensure backend is running and authenticated.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Syllabus tree & topic status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {syllabusTopicsQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading topics...</p> : null}
          {syllabusTopicsQuery.data?.map((topic) => (
            <div key={topic.id} className="rounded border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">{topic.name}</p>
                <span className={`rounded px-2 py-0.5 text-xs uppercase ${statusClassMap[topic.status]}`}>{topic.status.replace('_', ' ')}</span>
              </div>
              <div className="h-2 rounded bg-muted">
                <div className="h-2 rounded bg-primary" style={{ width: `${topic.completion}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily practice queue (MCQ + Mains gate + essay)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            MCQ gate: {gateStatusQuery.data ? `${gateStatusQuery.data.attemptedMcqs}/${gateStatusQuery.data.requiredMcqs}` : 'Loading...'}{' '}
            {gateStatusQuery.data?.isUnlocked ? '✅ Unlocked' : '🔒 Locked'}
          </p>
          <p>Mains question: {dailyQuestionQuery.data?.prompt ?? 'Complete required MCQs to unlock daily Mains question.'}</p>
          <p>Weekly essay prompt: {weeklyEssayQuery.data || 'Loading weekly essay prompt...'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feedback loop transparency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {feedbackLoopQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading feedback...</p> : null}
          {feedbackLoopQuery.data?.topics?.length ? (
            feedbackLoopQuery.data.topics.map((topic) => (
              <div key={topic.topicId} className="rounded border border-border p-3 text-sm">
                <p className="font-medium">{topic.topicId}</p>
                <p className="text-muted-foreground">
                  Accuracy: {topic.accuracy}% · Attempted: {topic.attemptedQuestions} · Difficulty Δ: {topic.difficultyTierDelta}
                </p>
                <p className="text-muted-foreground">{topic.reason}</p>
              </div>
            ))
          ) : !feedbackLoopQuery.isLoading && (
            <p className="text-sm text-muted-foreground">No recent attempts yet. Feedback loop will activate after submissions.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Non-repetition stats & weekly comparison</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {nonRepetitionQuery.isLoading ? <p>Loading stats...</p> : (
            <>
              <p>
                30-day attempts: {nonRepetitionQuery.data?.totalAttempts ?? 0} · Unique: {nonRepetitionQuery.data?.uniqueQuestionCount ?? 0} · Repeat attempts:{' '}
                {nonRepetitionQuery.data?.repeatAttempts ?? 0}
              </p>
              <p>Repetition rate: {nonRepetitionQuery.data?.repetitionRate ?? 0}%</p>
              <p className="mt-2">Weekly progress comparison: Current week 62% vs last snapshot 54% (demo baseline).</p>
              <p>Practice history timeline: Available from Test History; topic-wise breakdown shown in feedback panel above.</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
