'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

import { AiInsightsCard } from '@/components/analytics/ai-insights-card';
import {
  LazyAccuracyPieChart,
  LazyTimeDistributionHistogram,
  LazyTopicPerformanceBarChart,
} from '@/components/analytics/lazy-analytics-charts';
import { SuggestedStepsSection } from '@/components/analytics/suggested-steps-section';
import { WeakAreasSection } from '@/components/analytics/weak-areas-section';
import { testsApi, type TestAnalyticsResponse } from '@/lib/api-client';

export default function TestAnalyticsPage() {
  const params = useParams<{ id: string }>();
  const [analytics, setAnalytics] = useState<TestAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (active) {
        setLoading(true);
        setError(null);
      }

      if (!params.id) {
        if (active) {
          setLoading(false);
          setError('Test ID is missing.');
        }
        return;
      }

      try {
        const response = await testsApi.getAnalytics(params.id);
        if (active) {
          setAnalytics(response.data as TestAnalyticsResponse);
        }
      } catch {
        if (active) {
          setError('Could not load analytics from backend. Please try again.');
          setAnalytics(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [params.id]);

  const data = useMemo(() => analytics, [analytics]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Post-test analytics</h1>
        <p className="text-sm text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Post-test analytics</h1>
        <p className="text-sm text-muted-foreground">Test ID: {params.id ?? 'N/A'}</p>
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Post-test analytics</h1>
        <p className="text-sm text-muted-foreground">Test ID: {params.id ?? 'N/A'}</p>
        <p className="text-sm text-destructive">Analytics are unavailable for this test.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Post-test analytics</h1>
      <p className="text-sm text-muted-foreground">Test ID: {params.id ?? data.testId}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <LazyAccuracyPieChart
          correctAnswers={data.overall.correctAnswers}
          incorrectAnswers={data.overall.incorrectAnswers}
          skippedAnswers={data.overall.skippedAnswers}
        />
        <LazyTimeDistributionHistogram buckets={data.timeAnalysis.distribution} />
      </div>

      <LazyTopicPerformanceBarChart topics={data.accuracyByTopic} />
      <AiInsightsCard insights={data.ai.insights} />

      <div className="grid gap-4 lg:grid-cols-2">
        <WeakAreasSection weakAreas={data.ai.weakAreas} />
        <SuggestedStepsSection steps={data.ai.suggestedNextSteps} />
      </div>
    </div>
  );
}
