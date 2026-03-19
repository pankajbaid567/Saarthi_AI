'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GeneratedTest, getTestById, QuestionOption, submitTest } from '@/lib/test-engine';
import { useMCQStore } from '@/stores/mcq-store';

const WARNING_THRESHOLD_SECONDS = 300;

const formatSeconds = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, '0');
  const remainingSeconds = (safeSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
};

function TestHeaderTickers({
  totalQuestions,
  activeQuestionId,
  onAutoSubmit,
}: {
  totalQuestions: number;
  activeQuestionId: string;
  onAutoSubmit: () => void;
}) {
  const currentIndex = useMCQStore((state) => state.currentIndex);
  const timeRemainingSeconds = useMCQStore((state) => state.timeRemainingSeconds);
  const isSubmitting = useMCQStore((state) => state.isSubmitting);
  const timeSpentMap = useMCQStore((state) => state.timeSpentRef);
  const decrementTimeRemaining = useMCQStore((state) => state.decrementTimeRemaining);
  const incrementTimeSpent = useMCQStore((state) => state.incrementTimeSpent);
  const hasAutoSubmittedRef = useRef(false);

  useEffect(() => {
    if (isSubmitting) return;

    const timerId = window.setInterval(() => {
      decrementTimeRemaining();
      incrementTimeSpent(activeQuestionId);
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [activeQuestionId, isSubmitting, decrementTimeRemaining, incrementTimeSpent]);

  useEffect(() => {
    if (timeRemainingSeconds === 0 && !hasAutoSubmittedRef.current && !isSubmitting) {
      hasAutoSubmittedRef.current = true;
      onAutoSubmit();
    }
  }, [timeRemainingSeconds, isSubmitting, onAutoSubmit]);

  const questionTime = timeSpentMap[activeQuestionId] || 0;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle>
          Question {currentIndex + 1} of {totalQuestions}
        </CardTitle>
        <div className="text-sm font-medium">
          Total timer:{' '}
          <span className={timeRemainingSeconds <= WARNING_THRESHOLD_SECONDS ? 'text-destructive font-bold' : ''}>
            {formatSeconds(timeRemainingSeconds)}
          </span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Per-question timer: {formatSeconds(questionTime)}</p>
    </>
  );
}

export default function TestAttemptPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const testId = params.id;

  const {
    currentIndex,
    answers,
    flagged,
    doubts,
    isSubmitting,
    initializeTest,
    setAnswer,
    toggleFlag,
    toggleDoubt,
    setCurrentIndex,
    setIsSubmitting,
    reset,
  } = useMCQStore();

  const test = useMemo<GeneratedTest | null>(() => {
    if (!testId) return null;
    return getTestById(testId);
  }, [testId]);

  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);

  useEffect(() => {
    if (test && useMCQStore.getState().testId !== test.id) {
      initializeTest(test.id, (test.timeLimitMinutes ?? 0) * 60);
    }
  }, [test, initializeTest]);

  const submitCurrentTest = useCallback(() => {
    if (!test || isSubmitting) return;

    setIsSubmitting(true);
    const result = submitTest(test, answers);
    reset(); // Clear store after submission
    router.push(`/tests/${result.testId}/results`);
  }, [answers, isSubmitting, router, test, setIsSubmitting, reset]);

  const onSubmit = () => submitCurrentTest();

  if (!test) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Test not found</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const currentQuestion = test.questions[currentIndex] || test.questions[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
      <Card>
        <CardHeader className="space-y-3">
          <TestHeaderTickers
            totalQuestions={test.questions.length}
            activeQuestionId={currentQuestion.id}
            onAutoSubmit={submitCurrentTest}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-base font-medium">{currentQuestion.prompt}</p>
          <div className="grid gap-2">
            {(Object.keys(currentQuestion.options) as QuestionOption[]).map((optionKey) => {
              const isSelected = answers[currentQuestion.id] === optionKey;
              return (
                <button
                  key={optionKey}
                  type="button"
                  onClick={() => setAnswer(currentQuestion.id, optionKey)}
                  className={`rounded border p-3 text-left text-sm transition ${
                    isSelected ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'
                  }`}
                >
                  <span className="font-semibold">{optionKey}.</span> {currentQuestion.options[optionKey]}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => toggleFlag(currentQuestion.id)}>
              {flagged.includes(currentQuestion.id) ? 'Unflag review' : 'Flag for review'}
            </Button>
            <Button type="button" variant="outline" onClick={() => toggleDoubt(currentQuestion.id)}>
              {doubts.includes(currentQuestion.id) ? 'Clear doubt' : 'Mark for doubt'}
            </Button>
          </div>

          <div className="flex flex-wrap justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
            >
              Previous
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setShowSubmitConfirmation(true)}>
                Submit
              </Button>
              <Button
                type="button"
                onClick={() => setCurrentIndex(Math.min(test.questions.length - 1, currentIndex + 1))}
                disabled={currentIndex === test.questions.length - 1}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Question navigator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {test.questions.map((question, index) => {
              const isCurrent = index === currentIndex;
              const isAnswered = Boolean(answers[question.id]);
              const isFlagged = flagged.includes(question.id);
              const isDoubt = doubts.includes(question.id);

              let className = 'border-border';
              if (isAnswered) {
                className = 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100';
              }
              if (isFlagged) {
                className = 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-100';
              }
              if (isDoubt) {
                className = 'border-indigo-500 bg-indigo-500/10 text-indigo-900 dark:text-indigo-100';
              }
              if (isCurrent) {
                className = 'border-primary bg-primary/10 text-primary';
              }

              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={`rounded border p-2 text-xs font-medium ${className}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {showSubmitConfirmation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Submit test?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">You can review your answers after submission from results.</p>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowSubmitConfirmation(false)}>
                  Continue test
                </Button>
                <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Confirm submit'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
