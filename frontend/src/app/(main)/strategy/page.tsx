'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { strategyApi } from '@/lib/api-client';

const taskLabel: Record<string, string> = {
  study: 'Study',
  practice: 'Practice',
  revision: 'Revision',
  mains: 'Mains',
  essay: 'Essay',
};

export default function StrategyPage() {
  const queryClient = useQueryClient();
  const [timeAvailableMinutes, setTimeAvailableMinutes] = useState<number>(240);
  const [error, setError] = useState<string | null>(null);

  const todayQuery = useQuery({
    queryKey: ['strategy', 'today'],
    queryFn: async () => (await strategyApi.getToday()).data,
  });

  const weekQuery = useQuery({
    queryKey: ['strategy', 'week'],
    queryFn: async () => (await strategyApi.getWeek()).data,
  });

  const completeMutation = useMutation({
    mutationFn: async (taskId: string) => (await strategyApi.completeTask(taskId, true)).data,
    onSuccess: async (updatedToday) => {
      queryClient.setQueryData(['strategy', 'today'], updatedToday);
      await queryClient.invalidateQueries({ queryKey: ['strategy', 'week'] });
      setError(null);
    },
    onError: () => setError('Unable to mark task complete.'),
  });

  const regenerateMutation = useMutation({
    mutationFn: async () =>
      (
        await strategyApi.generate({
          timeAvailableMinutes,
        })
      ).data,
    onSuccess: (data) => {
      queryClient.setQueryData(['strategy', 'today'], data.today);
      queryClient.setQueryData(['strategy', 'week'], data.week);
      setError(null);
    },
    onError: () => setError('Unable to regenerate plan.'),
  });

  const today = todayQuery.data;
  const week = weekQuery.data;
  const loading = todayQuery.isLoading || weekQuery.isLoading;

  const completionPercent = today?.summary.completionPercent ?? 0;
  const countdownDays = (() => {
    if (!today?.summary.targetDate) {
      return null;
    }
    const target = new Date(today.summary.targetDate).getTime();
    const currentPlanDate = new Date(today.date).getTime();
    if (Number.isNaN(target) || Number.isNaN(currentPlanDate)) {
      return null;
    }
    return Math.max(0, Math.ceil((target - currentPlanDate) / (1000 * 60 * 60 * 24)));
  })();

  return (
    <main className="space-y-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Strategy Engine</h1>
          <p className="text-sm text-muted-foreground">Unified daily and weekly plan for study, practice, revision, mains and essay.</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={60}
            max={720}
            value={timeAvailableMinutes}
            onChange={(event) => setTimeAvailableMinutes(Number(event.target.value))}
            className="w-28 rounded-md border border-border bg-background px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={() => regenerateMutation.mutate()}
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
          >
            Regenerate
          </button>
        </div>
      </section>

      {loading ? <p className="text-sm text-muted-foreground">Loading strategy plan...</p> : null}
      {error ? <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}

      {today ? (
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Completion</p>
            <div className="mt-2 flex items-center gap-3">
              <div
                className="grid h-16 w-16 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(var(--primary) ${completionPercent}%, var(--muted) ${completionPercent}% 100%)`,
                }}
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-card text-xs font-semibold">
                  {Math.round(completionPercent)}%
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Keep momentum: complete revision + mains tasks before evening.</p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">AI Mentor Suggestion</p>
            <p className="mt-2 text-sm">Prioritize {today.summary.weakAreaFocus[0] ?? 'core static subjects'} and finish revision slot first.</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Target exam countdown</p>
            <p className="mt-2 text-xl font-semibold">{countdownDays === null ? 'Set target date in plan generation' : `${countdownDays} days left`}</p>
          </div>
        </section>
      ) : null}

      {today ? (
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-lg font-semibold">Today&apos;s Plan</h2>
          <div className="mt-3 space-y-2">
            {today.tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <div>
                  <p className="text-sm font-medium">[{taskLabel[task.type]}] {task.title}</p>
                  <p className="text-xs text-muted-foreground">{task.estimatedMinutes} min · {task.source}</p>
                </div>
                <button
                  type="button"
                  disabled={task.completed || completeMutation.isPending}
                  onClick={() => completeMutation.mutate(task.id)}
                  className="rounded border border-border px-2 py-1 text-xs disabled:opacity-50"
                >
                  {task.completed ? 'Done' : 'Mark complete'}
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {week ? (
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-lg font-semibold">Weekly View</h2>
          <div className="mt-2 grid gap-2 md:grid-cols-7">
            {week.plans.map((plan) => (
              <div key={plan.id} className="rounded-md border border-border p-2">
                <p className="text-xs font-semibold">{plan.date}</p>
                <p className="mt-1 text-xs text-muted-foreground">{plan.tasks.length} tasks</p>
                <p className="text-xs text-muted-foreground">{Math.round(plan.summary.completionPercent)}% done</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
