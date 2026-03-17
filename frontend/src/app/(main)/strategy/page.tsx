'use client';

import { useEffect, useMemo, useState } from 'react';

import { strategyApi, type StrategyDailyPlan, type StrategyWeekPlan } from '@/lib/api-client';

type LoadState = 'idle' | 'loading' | 'error';

const taskLabel: Record<string, string> = {
  study: 'Study',
  practice: 'Practice',
  revision: 'Revision',
  mains: 'Mains',
  essay: 'Essay',
};

export default function StrategyPage() {
  const [today, setToday] = useState<StrategyDailyPlan | null>(null);
  const [week, setWeek] = useState<StrategyWeekPlan | null>(null);
  const [state, setState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [timeAvailableMinutes, setTimeAvailableMinutes] = useState<number>(240);

  const loadPlans = async () => {
    setState('loading');
    setError(null);
    try {
      const [todayResponse, weekResponse] = await Promise.all([strategyApi.getToday(), strategyApi.getWeek()]);
      setToday(todayResponse.data);
      setWeek(weekResponse.data);
      setState('idle');
    } catch {
      setError('Unable to load strategy plans. Please login and try again.');
      setState('error');
    }
  };

  useEffect(() => {
    void loadPlans();
  }, []);

  const completeTask = async (taskId: string) => {
    try {
      const response = await strategyApi.completeTask(taskId, true);
      setToday(response.data);
      setWeek((current) => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          plans: current.plans.map((plan) => (plan.date === response.data.date ? response.data : plan)),
        };
      });
    } catch {
      setError('Unable to mark task complete.');
    }
  };

  const regenerate = async () => {
    setState('loading');
    setError(null);
    try {
      const response = await strategyApi.generate({ timeAvailableMinutes });
      setToday(response.data.today);
      setWeek(response.data.week);
      setState('idle');
    } catch {
      setState('error');
      setError('Unable to regenerate plan.');
    }
  };

  const completionPercent = today?.summary.completionPercent ?? 0;
  const countdownDays = useMemo(() => {
    if (!today?.summary.targetDate) {
      return null;
    }
    const target = new Date(today.summary.targetDate).getTime();
    if (Number.isNaN(target)) {
      return null;
    }
    return Math.max(0, Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24)));
  }, [today?.summary.targetDate]);

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
          <button type="button" onClick={regenerate} className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">
            Regenerate
          </button>
        </div>
      </section>

      {state === 'loading' ? <p className="text-sm text-muted-foreground">Loading strategy plan...</p> : null}
      {error ? <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}

      {today ? (
        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Completion</p>
            <div className="mt-2 flex items-center gap-3">
              <div
                className="grid h-16 w-16 place-items-center rounded-full border-4 border-primary"
                style={{ clipPath: `inset(0 ${100 - completionPercent}% 0 0)` }}
              >
                <span className="text-xs font-semibold">{Math.round(completionPercent)}%</span>
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
                  disabled={task.completed}
                  onClick={() => completeTask(task.id)}
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
