'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const loadingFallback = () => <Skeleton className="h-64 w-full" />;

export const LazyAccuracyPieChart = dynamic(
  () => import('@/components/analytics/accuracy-pie-chart').then((module) => module.AccuracyPieChart),
  { loading: loadingFallback },
);

export const LazyTopicPerformanceBarChart = dynamic(
  () => import('@/components/analytics/topic-performance-bar-chart').then((module) => module.TopicPerformanceBarChart),
  { loading: loadingFallback },
);

export const LazyTimeDistributionHistogram = dynamic(
  () => import('@/components/analytics/time-distribution-histogram').then((module) => module.TimeDistributionHistogram),
  { loading: loadingFallback },
);
