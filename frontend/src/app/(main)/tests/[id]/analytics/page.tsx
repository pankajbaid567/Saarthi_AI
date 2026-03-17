'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

import { AccuracyPieChart } from '@/components/analytics/accuracy-pie-chart';
import { AiInsightsCard } from '@/components/analytics/ai-insights-card';
import { SuggestedStepsSection } from '@/components/analytics/suggested-steps-section';
import { TimeDistributionHistogram } from '@/components/analytics/time-distribution-histogram';
import { TopicPerformanceBarChart } from '@/components/analytics/topic-performance-bar-chart';
import { WeakAreasSection } from '@/components/analytics/weak-areas-section';
import { testsApi, type TestAnalyticsResponse } from '@/lib/api-client';

const fallbackAnalytics: TestAnalyticsResponse = {
  testId: 'demo-test',
  overall: {
    totalQuestions: 20,
    attemptedQuestions: 19,
    correctAnswers: 11,
    incorrectAnswers: 8,
    skippedAnswers: 1,
    accuracy: 55,
  },
  accuracyByTopic: [
    { subject: 'Polity', topic: 'Federalism', correct: 2, total: 5, accuracy: 40 },
    { subject: 'History', topic: 'Medieval India', correct: 3, total: 5, accuracy: 60 },
    { subject: 'Geography', topic: 'Climate', correct: 6, total: 10, accuracy: 60 },
  ],
  timeAnalysis: {
    averageSeconds: 33.4,
    medianSeconds: 29,
    distribution: [
      { label: '0-15s', count: 4 },
      { label: '16-30s', count: 7 },
      { label: '31-60s', count: 6 },
      { label: '61s+', count: 3 },
    ],
    questionTimes: [],
  },
  sillyMistakes: [{ questionId: 'q-7', subject: 'Polity', topic: 'Federalism', changedFromCorrectToWrong: true }],
  guessingPatterns: {
    fastAnswerThresholdSeconds: 15,
    veryFastAnswers: 4,
    veryFastIncorrectAnswers: 3,
    randomGuessingLikely: true,
  },
  conceptGaps: [{ subject: 'Polity', topic: 'Federalism', wrongCount: 3, total: 5, accuracy: 40 }],
  ai: {
    weaknessAnalysisPrompt: 'demo',
    insights:
      'You are losing marks in Federalism due to concept uncertainty and quick guessing. Slow down and verify elimination before finalizing options.',
    weakAreas: ['Polity — Federalism'],
    suggestedNextSteps: [
      'Revise Polity — Federalism with NCERT + standard text summary.',
      'Solve two focused Federalism question sets under timed conditions.',
    ],
  },
};

export default function TestAnalyticsPage() {
  const params = useParams<{ id: string }>();
  const [analytics, setAnalytics] = useState<TestAnalyticsResponse | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!params.id) {
        return;
      }

      try {
        const response = await testsApi.getAnalytics(params.id);
        if (active) {
          setAnalytics(response.data as TestAnalyticsResponse);
        }
      } catch {
        if (active) {
          setAnalytics(fallbackAnalytics);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [params.id]);

  const data = useMemo(() => analytics ?? fallbackAnalytics, [analytics]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Post-test analytics</h1>
      <p className="text-sm text-muted-foreground">Test ID: {params.id ?? data.testId}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <AccuracyPieChart
          correctAnswers={data.overall.correctAnswers}
          incorrectAnswers={data.overall.incorrectAnswers}
          skippedAnswers={data.overall.skippedAnswers}
        />
        <TimeDistributionHistogram buckets={data.timeAnalysis.distribution} />
      </div>

      <TopicPerformanceBarChart topics={data.accuracyByTopic} />
      <AiInsightsCard insights={data.ai.insights} />

      <div className="grid gap-4 lg:grid-cols-2">
        <WeakAreasSection weakAreas={data.ai.weakAreas} />
        <SuggestedStepsSection steps={data.ai.suggestedNextSteps} />
      </div>
    </div>
  );
}
