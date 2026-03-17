'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { revisionApi, type ActiveRecallQuestion, type FlashcardItem, type RevisionPrediction } from '@/lib/api-client';

type RevisionState = {
  predictions: RevisionPrediction[];
  alerts: Array<{ topicId: string; topicName: string; message: string; severity: 'high' | 'moderate' }>;
  streak: { current: number; longest: number; graceDaysRemaining: number; history: string[] } | null;
  flashcards: FlashcardItem[];
};

const initialState: RevisionState = {
  predictions: [],
  alerts: [],
  streak: null,
  flashcards: [],
};

export default function DashboardPage() {
  const [state, setState] = useState<RevisionState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crashMode, setCrashMode] = useState(false);
  const [dailyTarget, setDailyTarget] = useState<number | null>(null);
  const [sprintSummary, setSprintSummary] = useState<string | null>(null);
  const [activeRecallSessionId, setActiveRecallSessionId] = useState<string | null>(null);
  const [activeRecallQuestion, setActiveRecallQuestion] = useState<ActiveRecallQuestion | null>(null);
  const [activeRecallAnswer, setActiveRecallAnswer] = useState('');
  const [activeRecallScore, setActiveRecallScore] = useState<number | null>(null);
  const [selectedFlashcard, setSelectedFlashcard] = useState<FlashcardItem | null>(null);
  const [showBack, setShowBack] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState('30');

  const loadRevisionDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [predictionsResponse, streaksResponse, flashcardsResponse] = await Promise.all([
        revisionApi.getPredictions(),
        revisionApi.getStreaks(),
        revisionApi.getFlashcards({ due: true, limit: 12 }),
      ]);
      const flashcards = flashcardsResponse.data.data;
      setState({
        predictions: predictionsResponse.data.data.predictedToForget,
        alerts: predictionsResponse.data.data.alerts,
        streak: streaksResponse.data.data,
        flashcards,
      });
      setSelectedFlashcard(flashcards[0] ?? null);
    } catch {
      setError('Unable to load NeuroRevise dashboard. Please login and retry.');
    } finally {
      setLoading(false);
    }
  };

  const startActiveRecall = async () => {
    if (state.predictions.length === 0) {
      return;
    }
    const topicIds = state.predictions.slice(0, 3).map((topic) => topic.topicId);
    const response = await revisionApi.startActiveRecall({ topicIds, questionCount: 3 });
    setActiveRecallSessionId(response.data.data.sessionId);
    setActiveRecallQuestion(response.data.data.questions[0] ?? null);
    setActiveRecallAnswer('');
    setActiveRecallScore(null);
  };

  const submitActiveRecall = async () => {
    if (!activeRecallSessionId || !activeRecallQuestion || !activeRecallAnswer.trim()) {
      return;
    }
    const response = await revisionApi.submitActiveRecallAnswer(activeRecallSessionId, {
      questionId: activeRecallQuestion.id,
      userAnswer: activeRecallAnswer,
      confidenceLevel: 3,
    });
    setActiveRecallScore(response.data.data.score);
  };

  const startSprint = async (durationMinutes: 15 | 30 | 45) => {
    const response = await revisionApi.startSprint({
      durationMinutes,
      crashMode,
      daysRemaining: crashMode ? Number(daysRemaining) || 30 : undefined,
    });
    const sprintData = response.data.data;
    setDailyTarget(sprintData.dailyTargetTopics);
    setSprintSummary(`Sprint started: ${sprintData.totalTopics} topics queued.`);
  };

  const retentionHeatmap = useMemo(() => {
    return state.predictions.slice(0, 8).map((topic) => ({
      ...topic,
      color:
        topic.currentRetention < 40
          ? 'bg-red-500'
          : topic.currentRetention < 70
            ? 'bg-amber-500'
            : 'bg-emerald-500',
    }));
  }, [state.predictions]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">NeuroRevise AI Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button onClick={loadRevisionDashboard} disabled={loading}>
            {loading ? 'Loading...' : 'Load revision data'}
          </Button>
          <Button variant={crashMode ? 'default' : 'outline'} onClick={() => setCrashMode((value) => !value)}>
            Last 30 days crash mode: {crashMode ? 'On' : 'Off'}
          </Button>
          {crashMode ? (
            <Input
              className="w-28"
              type="number"
              min={1}
              max={30}
              value={daysRemaining}
              onChange={(event) => setDaysRemaining(event.target.value)}
            />
          ) : null}
          {dailyTarget !== null ? <p className="text-sm text-muted-foreground">Daily target: {dailyTarget} topics/day</p> : null}
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Retention heatmap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {retentionHeatmap.map((item) => (
              <div key={item.topicId}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{item.topicName}</span>
                  <span>{item.currentRetention}%</span>
                </div>
                <div className="h-2 rounded bg-muted">
                  <div className={`h-2 rounded ${item.color}`} style={{ width: `${item.currentRetention}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Predictions & alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {state.alerts.slice(0, 5).map((alert) => (
              <div key={alert.topicId} className="rounded border p-2 text-sm">
                <p className="font-medium">
                  {alert.topicName} ({alert.severity})
                </p>
                <p className="text-muted-foreground">{alert.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active recall session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={startActiveRecall} disabled={state.predictions.length === 0}>
              Start active recall
            </Button>
            {activeRecallQuestion ? (
              <>
                <p className="text-sm font-medium">{activeRecallQuestion.questionText}</p>
                <Input value={activeRecallAnswer} onChange={(event) => setActiveRecallAnswer(event.target.value)} />
                <Button variant="outline" onClick={submitActiveRecall}>
                  Submit answer
                </Button>
                {activeRecallScore !== null ? <p className="text-sm">Score: {activeRecallScore}</p> : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Load data and start a session to practice recall.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revision sprint</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => startSprint(15)}>
                15 min
              </Button>
              <Button variant="outline" onClick={() => startSprint(30)}>
                30 min
              </Button>
              <Button variant="outline" onClick={() => startSprint(45)}>
                45 min
              </Button>
            </div>
            {sprintSummary ? <p className="text-sm">{sprintSummary}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Streak tracker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Current streak: {state.streak?.current ?? 0} days</p>
            <p>Longest streak: {state.streak?.longest ?? 0} days</p>
            <p>Grace days remaining: {state.streak?.graceDaysRemaining ?? 1}</p>
            <p className="text-muted-foreground">History points: {state.streak?.history.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Flashcards practice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">Due today: {state.flashcards.length}</p>
          {selectedFlashcard ? (
            <div className="rounded border p-3">
              <p className="text-sm font-medium">{showBack ? selectedFlashcard.back : selectedFlashcard.front}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setShowBack((value) => !value)}>
                  {showBack ? 'Show front' : 'Flip card'}
                </Button>
                {(['easy', 'good', 'hard', 'forgot'] as const).map((rating) => (
                  <Button
                    key={rating}
                    variant="ghost"
                    onClick={() => {
                      const currentIndex = state.flashcards.findIndex((card) => card.id === selectedFlashcard.id);
                      const nextCard = state.flashcards[currentIndex + 1] ?? null;
                      setSelectedFlashcard(nextCard);
                      setShowBack(false);
                    }}
                  >
                    {rating}
                  </Button>
                ))}
              </div>
              <div className="mt-3 h-2 rounded bg-muted">
                <div
                  className="h-2 rounded bg-primary"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        ((state.flashcards.findIndex((card) => card.id === selectedFlashcard.id) + 1) /
                          Math.max(1, state.flashcards.length)) *
                          100,
                      ),
                    )}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No due flashcards. Load dashboard data first.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
