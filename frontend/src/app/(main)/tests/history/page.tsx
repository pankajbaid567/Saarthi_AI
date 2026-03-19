'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllResults, getSubjects, type Subject } from '@/lib/test-engine';

const typeLabelMap: Record<string, string> = {
  topic: 'Topic',
  mixed: 'Mixed',
  pyq: 'PYQ',
  'weak-area': 'Weak-area',
};

const toDateInput = (value: string) => value.slice(0, 10);
const MIN_BAR_HEIGHT_PX = 8;
const MAX_BAR_HEIGHT_PX = 80;
const getScorePercent = (score: number, maxScore: number) => {
  if (maxScore <= 0) {
    return 0;
  }
  return Math.max(0, (score / maxScore) * 100);
};

export default function TestHistoryPage() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [subjects, setSubjects] = useState<Subject[]>([]);
  useEffect(() => {
    let active = true;
    getSubjects().then((res) => {
      if (active) setSubjects(res);
    });
    return () => { active = false; };
  }, []);

  const allResults = getAllResults();

  const filteredResults = allResults.filter((result) => {
    if (typeFilter !== 'all' && result.type !== typeFilter) {
      return false;
    }

    if (subjectFilter !== 'all' && result.subjectName !== subjectFilter) {
      return false;
    }

    const attemptDate = toDateInput(result.attemptedAt);
    if (fromDate && attemptDate < fromDate) {
      return false;
    }

    if (toDate && attemptDate > toDate) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Test history filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Type</span>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
              <option value="all">All</option>
              <option value="topic">Topic</option>
              <option value="mixed">Mixed</option>
              <option value="pyq">PYQ</option>
              <option value="weak-area">Weak-area</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Subject</span>
            <select value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
              <option value="all">All</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.name}>
                  {subject.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">From date</span>
            <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">To date</span>
            <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Past tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredResults.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tests found for current filters.</p>
          ) : (
            filteredResults.map((result) => {
              const scorePercent = getScorePercent(result.score, result.maxScore);

              return (
                <Link key={result.testId} href={`/tests/${result.testId}/results`} className="block rounded border border-border p-3 hover:bg-muted">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{result.subjectName}</p>
                    <p className="text-xs text-muted-foreground">{new Date(result.attemptedAt).toLocaleString()}</p>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span>{typeLabelMap[result.type]}</span>
                    <span>
                      {result.score} / {result.maxScore}
                    </span>
                    <span>
                      {result.correctCount}C · {result.incorrectCount}I · {result.skippedCount}S
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded bg-muted">
                    <div className="h-2 rounded bg-primary" style={{ width: `${Math.min(100, Math.max(0, scorePercent))}%` }} />
                  </div>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance trend chart</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredResults.length === 0 ? (
            <p className="text-sm text-muted-foreground">Take a test to see trend data.</p>
          ) : (
            <div className="flex items-end gap-2 overflow-x-auto pb-2">
              {filteredResults
                .slice()
                .reverse()
                .map((result) => {
                  const scorePercent = getScorePercent(result.score, result.maxScore);
                  const barHeight = (scorePercent / 100) * MAX_BAR_HEIGHT_PX;
                  return (
                    <div key={`trend-${result.testId}`} className="flex min-w-16 flex-col items-center gap-1">
                      <div className="w-10 rounded-t bg-primary" style={{ height: `${Math.max(MIN_BAR_HEIGHT_PX, barHeight)}px` }} />
                      <span className="text-[10px] text-muted-foreground">{Math.round(scorePercent)}%</span>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
