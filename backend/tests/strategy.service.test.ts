import { describe, expect, it } from 'vitest';

import { StrategyService } from '../src/services/strategy.service.js';

describe('strategy service', () => {
  it('returns default daily and weekly plans', () => {
    const service = new StrategyService();

    const today = service.getTodayPlan('student-1');
    const week = service.getWeekPlan('student-1');

    expect(today.tasks.length).toBeGreaterThanOrEqual(4);
    expect(today.tasks.some((task) => task.type === 'revision')).toBe(true);
    expect(week.plans).toHaveLength(7);
  });

  it('applies clamped signals and overload adjustment while generating plans', () => {
    const service = new StrategyService();

    const generated = service.generate('student-1', {
      timeAvailableMinutes: 20,
      prelimsFocusPercent: 1.5,
      syllabusCoveragePercent: 130,
      retentionUrgencyCount: 99,
      weakAreas: ['A', 'B', 'C', 'D'],
    });

    expect(generated.today.summary.overloadAdjusted).toBe(true);
    expect(generated.today.tasks.find((task) => task.type === 'revision')?.estimatedMinutes).toBeLessThanOrEqual(90);
    expect(generated.week.targets.weeklyPracticeQuestions).toBeGreaterThan(0);
  });

  it('marks tasks complete and errors for unknown task ids', () => {
    const service = new StrategyService();
    const today = service.getTodayPlan('student-1');
    const firstTask = today.tasks[0];

    const updated = service.completeTask('student-1', firstTask.id, true);
    expect(updated.summary.completionPercent).toBeGreaterThan(0);

    expect(() => service.completeTask('student-1', 'missing-task')).toThrow('not found');
  });
});
