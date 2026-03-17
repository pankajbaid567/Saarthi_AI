'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GeneratedTest, getTestById, QuestionOption, submitTest } from '@/lib/test-engine';

const WARNING_THRESHOLD_SECONDS = 300;

const formatSeconds = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, '0');
  const remainingSeconds = (safeSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
};

export default function TestAttemptPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const test = useMemo<GeneratedTest | null>(() => {
    if (!params.id) {
      return null;
    }
    return getTestById(params.id);
  }, [params.id]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuestionOption | null>>({});
  const [flagged, setFlagged] = useState<string[]>([]);
  const [doubts, setDoubts] = useState<string[]>([]);
  const [questionTimeSpent, setQuestionTimeSpent] = useState<Record<string, number>>({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState((test?.timeLimitMinutes ?? 0) * 60);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasAutoSubmittedRef = useRef(false);

  const submitCurrentTest = useCallback(() => {
    if (!test || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const result = submitTest(test, answers);
    router.push(`/tests/${result.testId}/results`);
  }, [answers, isSubmitting, router, test]);

  useEffect(() => {
    if (!test || isSubmitting) {
      return;
    }

    const activeQuestion = test.questions[currentIndex];

    const timerId = window.setInterval(() => {
      setTimeRemainingSeconds((current) => Math.max(0, current - 1));

      setQuestionTimeSpent((current) => ({
        ...current,
        [activeQuestion.id]: (current[activeQuestion.id] ?? 0) + 1,
      }));
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [currentIndex, isSubmitting, test]);

  useEffect(() => {
    if (timeRemainingSeconds > 0 || hasAutoSubmittedRef.current) {
      return;
    }

    hasAutoSubmittedRef.current = true;
    const submitTimeoutId = window.setTimeout(() => {
      submitCurrentTest();
    }, 0);

    return () => {
      window.clearTimeout(submitTimeoutId);
    };
  }, [submitCurrentTest, timeRemainingSeconds]);

  const currentQuestion = useMemo(() => (test ? test.questions[currentIndex] : null), [currentIndex, test]);

  const onToggle = (list: string[], questionId: string, setter: (items: string[]) => void) => {
    if (list.includes(questionId)) {
      setter(list.filter((item) => item !== questionId));
      return;
    }
    setter([...list, questionId]);
  };

  const onSubmit = () => submitCurrentTest();

  if (!test || !currentQuestion) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Test not found</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>
              Question {currentIndex + 1} of {test.questions.length}
            </CardTitle>
            <div className="text-sm font-medium">
              Total timer: <span className={timeRemainingSeconds <= WARNING_THRESHOLD_SECONDS ? 'text-red-500' : ''}>{formatSeconds(timeRemainingSeconds)}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Per-question timer: {formatSeconds(questionTimeSpent[currentQuestion.id] ?? 0)}</p>
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
                  onClick={() => setAnswers((current) => ({ ...current, [currentQuestion.id]: optionKey }))}
                  className={`rounded border p-3 text-left text-sm transition ${isSelected ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'}`}
                >
                  <span className="font-semibold">{optionKey}.</span> {currentQuestion.options[optionKey]}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => onToggle(flagged, currentQuestion.id, setFlagged)}>
              {flagged.includes(currentQuestion.id) ? 'Unflag review' : 'Flag for review'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onToggle(doubts, currentQuestion.id, setDoubts)}>
              {doubts.includes(currentQuestion.id) ? 'Clear doubt' : 'Mark for doubt'}
            </Button>
          </div>

          <div className="flex flex-wrap justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))} disabled={currentIndex === 0}>
              Previous
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setShowSubmitConfirmation(true)}>
                Submit
              </Button>
              <Button type="button" onClick={() => setCurrentIndex((value) => Math.min(test.questions.length - 1, value + 1))} disabled={currentIndex === test.questions.length - 1}>
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
                className = 'border-emerald-500 bg-emerald-500/10';
              }
              if (isFlagged) {
                className = 'border-amber-500 bg-amber-500/10';
              }
              if (isDoubt) {
                className = 'border-indigo-500 bg-indigo-500/10';
              }
              if (isCurrent) {
                className = 'border-primary bg-primary/10';
              }

              return (
                <button key={question.id} type="button" onClick={() => setCurrentIndex(index)} className={`rounded border p-2 text-xs font-medium ${className}`}>
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
                <Button type="button" onClick={onSubmit}>
                  Confirm submit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
