'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mainsApi, type MainsQuestion } from '@/lib/api-client';

const formatSeconds = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, '0');
  const remainingSeconds = (safeSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
};

export default function MainsQuestionDetailPage() {
  const params = useParams<{ id: string }>();
  const [question, setQuestion] = useState<MainsQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [draftHtml, setDraftHtml] = useState('<p></p>');

  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p></p>',
    immediatelyRender: false,
    onUpdate: ({ editor: nextEditor }) => {
      setDraftHtml(nextEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!params.id) {
      return;
    }

    const loadQuestion = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await mainsApi.getQuestion(params.id);
        setQuestion(response.data);
      } catch {
        setError('Unable to load question details');
      } finally {
        setLoading(false);
      }
    };

    void loadQuestion();
  }, [params.id]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    if (!params.id || !editor) {
      return;
    }

    const existingDraft = window.localStorage.getItem(`mains-draft-${params.id}`);
    if (existingDraft) {
      editor.commands.setContent(existingDraft);
      setDraftHtml(existingDraft);
    }
  }, [editor, params.id]);

  const wordCount = useMemo(() => {
    const plainText = draftHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!plainText) {
      return 0;
    }
    return plainText.split(' ').length;
  }, [draftHtml]);

  const saveDraft = () => {
    if (!params.id || !editor) {
      return;
    }

    const html = editor.getHTML();
    window.localStorage.setItem(`mains-draft-${params.id}`, html);
    const now = new Date().toISOString();
    setSavedAt(now);
  };

  const submitForEvaluation = () => {
    if (!params.id || !editor) {
      return;
    }

    const submissionsRaw = window.localStorage.getItem('mains-submissions');
    const submissions = submissionsRaw ? (JSON.parse(submissionsRaw) as Array<Record<string, unknown>>) : [];
    const now = new Date().toISOString();

    submissions.push({
      questionId: params.id,
      submittedAt: now,
      answer: editor.getHTML(),
      wordCount,
      elapsedSeconds,
    });

    window.localStorage.setItem('mains-submissions', JSON.stringify(submissions));
    setSubmittedAt(now);
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading question...</p>;
  }

  if (error || !question) {
    return <p className="text-sm text-red-500">{error ?? 'Question not found'}</p>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Mains Question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm font-medium">{question.questionText}</p>
          <p className="text-xs text-muted-foreground">
            {question.type.toUpperCase()} • {question.marks} marks • Suggested {question.suggestedWordLimit} words
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Write your answer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span>Timer: {formatSeconds(elapsedSeconds)}</span>
            <span>Word count: {wordCount}</span>
          </div>
          <div className="min-h-56 rounded-md border border-border p-3">
            <EditorContent editor={editor} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={saveDraft}>
              Save draft
            </Button>
            <Button type="button" onClick={submitForEvaluation}>
              Submit for evaluation
            </Button>
          </div>
          {savedAt ? <p className="text-xs text-muted-foreground">Draft saved at {new Date(savedAt).toLocaleTimeString()}.</p> : null}
          {submittedAt ? (
            <p className="text-xs text-emerald-600">Submitted for evaluation at {new Date(submittedAt).toLocaleTimeString()}.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
