'use client';

import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { essaysApi, mainsApi, practiceApi, type MainsDailyQuestionResponse, type MainsGateStatus } from '@/lib/api-client';

const topicStatuses = [
  { id: 't1', name: 'Parliamentary Committees', status: 'completed', completion: 100 },
  { id: 't2', name: 'Federalism Challenges', status: 'in_progress', completion: 62 },
  { id: 't3', name: 'Local Governance', status: 'not_started', completion: 0 },
];

const statusClassMap: Record<string, string> = {
  completed: 'bg-emerald-500/20 text-emerald-700',
  in_progress: 'bg-amber-500/20 text-amber-700',
  not_started: 'bg-slate-500/20 text-slate-700',
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
  const [gateStatus, setGateStatus] = useState<MainsGateStatus | null>(null);
  const [dailyQuestion, setDailyQuestion] = useState<MainsDailyQuestionResponse['question']>(null);
  const [weeklyEssayPrompt, setWeeklyEssayPrompt] = useState<string>('');
  const [feedbackLoop, setFeedbackLoop] = useState<FeedbackLoopResponse | null>(null);
  const [nonRepetitionStats, setNonRepetitionStats] = useState<NonRepetitionStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [gateStatusResponse, questionResponse, essayQuestionResponse, feedbackLoopResponse, nonRepetitionResponse] =
          await Promise.all([
            mainsApi.getGateStatus(),
            mainsApi.getDailyQuestion(),
            essaysApi.getWeeklyQuestion(),
            practiceApi.getFeedbackLoop(),
            practiceApi.getNonRepetitionStats(),
          ]);

        if (!active) {
          return;
        }

        setGateStatus(gateStatusResponse.data);
        setDailyQuestion(questionResponse.data.question);
        setWeeklyEssayPrompt(essayQuestionResponse.data.prompt);
        setFeedbackLoop(feedbackLoopResponse.data as FeedbackLoopResponse);
        setNonRepetitionStats(nonRepetitionResponse.data as NonRepetitionStats);
        setError(null);
      } catch {
        if (active) {
          setError('Unable to load SyllabusFlow data. Please ensure backend is running and authenticated.');
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">SyllabusFlow AI</h1>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Syllabus tree & topic status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topicStatuses.map((topic) => (
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
            MCQ gate: {gateStatus ? `${gateStatus.attemptedMcqs}/${gateStatus.requiredMcqs}` : 'Loading...'}{' '}
            {gateStatus?.isUnlocked ? '✅ Unlocked' : '🔒 Locked'}
          </p>
          <p>Mains question: {dailyQuestion?.prompt ?? 'Complete required MCQs to unlock daily Mains question.'}</p>
          <p>Weekly essay prompt: {weeklyEssayPrompt || 'Loading weekly essay prompt...'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feedback loop transparency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {feedbackLoop?.topics?.length ? (
            feedbackLoop.topics.map((topic) => (
              <div key={topic.topicId} className="rounded border border-border p-3 text-sm">
                <p className="font-medium">{topic.topicId}</p>
                <p className="text-muted-foreground">
                  Accuracy: {topic.accuracy}% · Attempted: {topic.attemptedQuestions} · Difficulty Δ: {topic.difficultyTierDelta}
                </p>
                <p className="text-muted-foreground">{topic.reason}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No recent attempts yet. Feedback loop will activate after submissions.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Non-repetition stats & weekly comparison</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            30-day attempts: {nonRepetitionStats?.totalAttempts ?? 0} · Unique: {nonRepetitionStats?.uniqueQuestionCount ?? 0} · Repeat attempts:{' '}
            {nonRepetitionStats?.repeatAttempts ?? 0}
          </p>
          <p>Repetition rate: {nonRepetitionStats?.repetitionRate ?? 0}%</p>
          <p className="mt-2">Weekly progress comparison: Current week 62% vs last snapshot 54% (demo baseline).</p>
          <p>Practice history timeline: Available from Test History; topic-wise breakdown shown in feedback panel above.</p>
        </CardContent>
      </Card>
    </div>
  );
}
