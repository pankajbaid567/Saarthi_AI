'use client';

import { useMemo, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mainsApi, type MainsQuestion, type MainsSubmissionDetail, type MainsSubmissionResponse } from '@/lib/api-client';

const initialQuestionState: MainsQuestion[] = [];

export default function MainsEvaluationPage() {
  const [questions, setQuestions] = useState<MainsQuestion[]>(initialQuestionState);
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [submission, setSubmission] = useState<MainsSubmissionResponse | null>(null);
  const [latestDetail, setLatestDetail] = useState<MainsSubmissionDetail | null>(null);
  const [trend, setTrend] = useState<Array<{ topicId: string; attempts: number; latestScore: number; improvement: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedQuestion = useMemo(
    () => questions.find((question) => question.id === selectedQuestionId) ?? null,
    [questions, selectedQuestionId],
  );

  const loadQuestions = async () => {
    setError(null);
    try {
      const response = await mainsApi.listQuestions();
      const items = response.data.items ?? [];
      setQuestions(items);
      if (!selectedQuestionId && items[0]?.id) {
        setSelectedQuestionId(items[0].id);
      }
    } catch {
      setError('Could not load mains questions. Ensure backend is running and authenticated token exists.');
    }
  };

  const handleSubmit = async () => {
    if (!selectedQuestionId || !answerText.trim()) {
      setError('Please select a question and write an answer before submitting.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const submitRes = await mainsApi.submitAnswer({
        questionId: selectedQuestionId,
        answerText,
        wordCount: answerText.trim().split(/\s+/).filter(Boolean).length,
      });
      setSubmission(submitRes.data);

      const submissionsRes = await mainsApi.listSubmissions();
      setTrend(submissionsRes.data.improvementByTopic ?? []);

      if (submitRes.data.submissionId) {
        const detailRes = await mainsApi.getSubmission(submitRes.data.submissionId);
        setLatestDetail(detailRes.data);
      }
    } catch {
      setError('Submission failed. Please verify login token and backend availability.');
    } finally {
      setLoading(false);
    }
  };

  const scorePercent = submission ? Math.round((submission.overallScore / submission.maxScore) * 100) : 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Mains AI Evaluation</h1>

      <Card>
        <CardHeader>
          <CardTitle>Answer submission</CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose a mains question, write your answer, and get AI-driven score breakdown.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => void loadQuestions()}>
              Load Questions
            </Button>
            <select
              className="min-w-80 rounded border border-border bg-background p-2 text-sm"
              value={selectedQuestionId}
              onChange={(event) => setSelectedQuestionId(event.target.value)}
            >
              <option value="">Select question</option>
              {questions.map((question) => (
                <option key={question.id} value={question.id}>
                  {question.topicName}: {question.questionText.slice(0, 80)}...
                </option>
              ))}
            </select>
          </div>
          {selectedQuestion ? (
            <p className="text-sm text-muted-foreground">
              {selectedQuestion.questionText} (Marks: {selectedQuestion.marks}, Word limit: {selectedQuestion.wordLimit})
            </p>
          ) : null}
          <textarea
            className="min-h-40 w-full rounded border border-border bg-background p-3 text-sm"
            value={answerText}
            onChange={(event) => setAnswerText(event.target.value)}
            placeholder="Write your mains answer with introduction, body, and conclusion..."
          />
          <Button type="button" onClick={() => void handleSubmit()} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit for evaluation'}
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      {submission ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Score gauge</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-2">
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-8 border-primary text-xl font-bold">
                {submission.overallScore}/{submission.maxScore}
              </div>
              <p className="text-sm text-muted-foreground">{scorePercent}% overall</p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Detailed breakdown cards</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded border border-border p-3 text-sm">Structure: {submission.breakdown.structure.score}/2</div>
              <div className="rounded border border-border p-3 text-sm">Content: {submission.breakdown.content.score}/4</div>
              <div className="rounded border border-border p-3 text-sm">Keywords: {submission.breakdown.keywords.score}/2</div>
              <div className="rounded border border-border p-3 text-sm">Presentation: {submission.breakdown.presentation.score}/2</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Improvement suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {submission.improvements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Side-by-side comparison view</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded border border-border p-3">
                <p className="mb-2 text-sm font-medium">Model answer</p>
                <p className="text-sm text-muted-foreground">{submission.modelAnswer}</p>
              </div>
              <div className="rounded border border-border p-3">
                <p className="mb-2 text-sm font-medium">Topper answer</p>
                <p className="text-sm text-muted-foreground">{submission.topperAnswer}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Historical score trend chart</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {trend.length === 0 ? (
                <p className="text-sm text-muted-foreground">No trend data yet.</p>
              ) : (
                trend.map((entry) => {
                  const width = Math.max(5, Math.round((entry.latestScore / 10) * 100));
                  return (
                    <div key={entry.topicId} className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Topic {entry.topicId.slice(0, 8)}</span>
                        <span>
                          Latest: {entry.latestScore}/10 | Improvement: {entry.improvement >= 0 ? '+' : ''}
                          {entry.improvement}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded bg-muted">
                        <div className="h-full rounded bg-primary" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {latestDetail ? (
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Latest submission detail</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Submission ID: {latestDetail.id} | Word count: {latestDetail.wordCount}
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
