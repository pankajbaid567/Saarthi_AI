'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getResultByTestId, QuestionOption } from '@/lib/test-engine';

const typeLabelMap: Record<string, string> = {
  topic: 'Topic',
  mixed: 'Mixed',
  pyq: 'PYQ',
  'weak-area': 'Weak-area',
};

export default function TestResultsPage() {
  const params = useParams<{ id: string }>();
  const result = useMemo(() => getResultByTestId(params.id), [params.id]);

  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No result found</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/tests/history">
            <Button type="button">Go to test history</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const percentage = result.maxScore > 0 ? ((result.score / result.maxScore) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Test result ({typeLabelMap[result.type]})</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Score</p>
            <p className="text-2xl font-semibold">
              {result.score} / {result.maxScore}
            </p>
            <p className="text-sm text-muted-foreground">{percentage}%</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Correct</p>
            <p className="text-2xl font-semibold text-emerald-600">{result.correctCount}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Incorrect</p>
            <p className="text-2xl font-semibold text-red-600">{result.incorrectCount}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-muted-foreground">Skipped</p>
            <p className="text-2xl font-semibold text-slate-500">{result.skippedCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Question-by-question review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.questionReviews.map((question, index) => (
            <article key={question.questionId} className="rounded border border-border p-4">
              <p className="mb-2 text-sm font-semibold">
                Q{index + 1}. {question.prompt}
              </p>
              <div className="space-y-2">
                {(Object.keys(question.options) as QuestionOption[]).map((optionKey) => {
                  const isCorrectOption = question.correctOption === optionKey;
                  const isSelectedWrong = question.selectedOption === optionKey && !isCorrectOption;

                  return (
                    <div
                      key={optionKey}
                      className={`rounded border px-3 py-2 text-sm ${isCorrectOption ? 'border-emerald-500 bg-emerald-500/10' : isSelectedWrong ? 'border-red-500 bg-red-500/10' : 'border-border'}`}
                    >
                      <span className="font-semibold">{optionKey}.</span> {question.options[optionKey]}
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Your answer: {question.selectedOption ?? 'Skipped'} · Correct answer: {question.correctOption}
              </p>
              <p className="mt-1 text-sm">
                <span className="font-medium">Explanation:</span> {question.explanation}
              </p>
            </article>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
