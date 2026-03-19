import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { revisionApi, type ActiveRecallQuestion, type RevisionPrediction } from '@/lib/api-client';

export function ActiveRecallWidget({ predictions }: { predictions: RevisionPrediction[] }) {
  const [activeRecallSessionId, setActiveRecallSessionId] = useState<string | null>(null);
  const [activeRecallQuestion, setActiveRecallQuestion] = useState<ActiveRecallQuestion | null>(null);
  const [activeRecallAnswer, setActiveRecallAnswer] = useState('');
  const [activeRecallScore, setActiveRecallScore] = useState<number | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startActiveRecall = async () => {
    if (predictions.length === 0) return;
    setIsStarting(true);
    try {
      const topicIds = predictions.slice(0, 3).map((topic) => topic.topicId);
      const response = await revisionApi.startActiveRecall({ topicIds, questionCount: 3 });
      setActiveRecallSessionId(response.data.data.sessionId);
      setActiveRecallQuestion(response.data.data.questions[0] ?? null);
      setActiveRecallAnswer('');
      setActiveRecallScore(null);
    } finally {
      setIsStarting(false);
    }
  };

  const submitActiveRecall = async () => {
    if (!activeRecallSessionId || !activeRecallQuestion || !activeRecallAnswer.trim()) {
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await revisionApi.submitActiveRecallAnswer(activeRecallSessionId, {
        questionId: activeRecallQuestion.id,
        userAnswer: activeRecallAnswer,
        confidenceLevel: 3,
      });
      setActiveRecallScore(response.data.data.score);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Active recall session</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 flex-1">
        <Button onClick={startActiveRecall} disabled={predictions.length === 0 || isStarting}>
          {isStarting ? 'Starting...' : 'Start active recall'}
        </Button>
        {activeRecallQuestion ? (
          <form 
            className="space-y-2 mt-4" 
            onSubmit={(e) => {
              e.preventDefault();
              void submitActiveRecall();
            }}
          >
            <p className="text-sm font-medium">{activeRecallQuestion.questionText}</p>
            <Input 
              value={activeRecallAnswer} 
              onChange={(event) => setActiveRecallAnswer(event.target.value)} 
              placeholder="Type your answer here..."
              disabled={isSubmitting}
            />
            <Button type="submit" variant="outline" disabled={isSubmitting || !activeRecallAnswer.trim()}>
              Submit answer
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