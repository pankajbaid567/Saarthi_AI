import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { revisionApi, type ActiveRecallQuestion, type RevisionPrediction } from '@/lib/api-client';

export function ActiveRecallWidget({ predictions }: { predictions: RevisionPrediction[] }) {
  const [activeRecallSessionId, setActiveRecallSessionId] = useState<string | null>(null);
  const [activeRecallQuestion, setActiveRecallQuestion] = useState<ActiveRecallQuestion | null>(null);
  const [activeRecallAnswer, setActiveRecallAnswer] = useState('');
  const [activeRecallScore, setActiveRecallScore] = useState<number | null>(null);

  const startSessionMutation = useMutation({
    mutationFn: async (topicIds: string[]) => {
      const response = await revisionApi.startActiveRecall({ topicIds, questionCount: 3 });
      return response.data.data;
    },
    onSuccess: (data) => {
      setActiveRecallSessionId(data.sessionId);
      setActiveRecallQuestion(data.questions[0] ?? null);
      setActiveRecallAnswer('');
      setActiveRecallScore(null);
    },
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async ({ sessionId, questionId, userAnswer }: { sessionId: string; questionId: string; userAnswer: string }) => {
      const response = await revisionApi.submitActiveRecallAnswer(sessionId, {
        questionId,
        userAnswer,
        confidenceLevel: 3,
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      setActiveRecallScore(data.score);
    },
  });

  const handleStart = () => {
    if (predictions.length === 0) return;
    const topicIds = predictions.slice(0, 3).map((topic) => topic.topicId);
    startSessionMutation.mutate(topicIds);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecallSessionId || !activeRecallQuestion || !activeRecallAnswer.trim()) {
      return;
    }
    submitAnswerMutation.mutate({
      sessionId: activeRecallSessionId,
      questionId: activeRecallQuestion.id,
      userAnswer: activeRecallAnswer,
    });
  };

  const isStarting = startSessionMutation.isPending;
  const isSubmitting = submitAnswerMutation.isPending;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Active recall session</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 flex-1">
        <Button onClick={handleStart} disabled={predictions.length === 0 || isStarting}>
          {isStarting ? 'Starting...' : 'Start active recall'}
        </Button>
        {activeRecallQuestion ? (
          <form className="space-y-2 mt-4" onSubmit={handleSubmit}>
            <p className="text-sm font-medium">{activeRecallQuestion.questionText}</p>
            <Input 
              value={activeRecallAnswer} 
              onChange={(event) => setActiveRecallAnswer(event.target.value)} 
              placeholder="Type your answer here..."
              disabled={isSubmitting}
            />
            <Button type="submit" variant="outline" disabled={isSubmitting || !activeRecallAnswer.trim()}>
              {isSubmitting ? 'Submitting...' : 'Submit answer'}
            </Button>
            {activeRecallScore !== null ? <p className="text-sm font-semibold text-primary">Score: {activeRecallScore}</p> : null}
          </form>
        ) : (
          <p className="text-sm text-muted-foreground mt-4">Load data and start a session to practice recall.</p>
        )}
      </CardContent>
    </Card>
  );
}