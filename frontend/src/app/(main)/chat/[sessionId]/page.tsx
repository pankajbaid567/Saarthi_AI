'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ChatMessageCard } from '@/components/chat/chat-message';
import { MCQOptions } from '@/components/chat/mcq-options';
import { PerformanceSummaryCard } from '@/components/chat/performance-summary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { chatApi } from '@/lib/chat-api';
import { useChatStore } from '@/stores/chat-store';

export default function ChatSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [streamDraft, setStreamDraft] = useState('');
  const { currentSession, setCurrentSession } = useChatStore();

  useEffect(() => {
    if (!params.sessionId) {
      return;
    }

    void (async () => {
      try {
        const response = await chatApi.getSession(params.sessionId);
        setCurrentSession(response.data);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.sessionId, setCurrentSession]);

  const pendingQuestion = useMemo(() => {
    return currentSession?.pendingQuestion ?? null;
  }, [currentSession]);

  const refreshSession = async () => {
    if (!params.sessionId) {
      return;
    }
    const response = await chatApi.getSession(params.sessionId);
    setCurrentSession(response.data);
  };

  const sendMessage = async (message: string) => {
    if (!params.sessionId || !message.trim() || typing) {
      return;
    }

    setTyping(true);
    setStreamDraft('');
    try {
      await chatApi.sendMessageStream(params.sessionId, message, (chunk) => {
        setStreamDraft((prev) => `${prev}${prev ? ' ' : ''}${chunk}`);
      });
      await refreshSession();
      setInputValue('');
    } finally {
      setTyping(false);
      setStreamDraft('');
    }
  };

  if (loading || !currentSession) {
    return <p className="text-sm text-muted-foreground">Loading chat session...</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[3fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{currentSession.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="max-h-[55vh] space-y-2 overflow-auto rounded border border-border p-3">
            {currentSession.messages.map((message, index) => (
              <ChatMessageCard key={`${message.createdAt}-${index}`} message={message} />
            ))}
            {typing ? (
              <div className="inline-block rounded border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
                AI is typing...
              </div>
            ) : null}
            {streamDraft ? (
              <div className="inline-block rounded border border-border bg-card px-3 py-2 text-sm">{streamDraft}</div>
            ) : null}
          </div>

          {pendingQuestion ? <MCQOptions question={pendingQuestion} disabled={typing} onSelect={(option) => void sendMessage(option)} /> : null}

          <div className="flex gap-2">
            <Input value={inputValue} onChange={(event) => setInputValue(event.target.value)} placeholder="Ask 10 MCQs on Federalism or answer A/B/C/D" />
            <Button onClick={() => void sendMessage(inputValue)} disabled={typing || !inputValue.trim()}>
              Send
            </Button>
            <Button variant="outline" onClick={() => void sendMessage('end session')} disabled={typing}>
              End
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Mode: {currentSession.mode.replaceAll('_', ' ')}</p>
            <p>Subject: {currentSession.subject}</p>
            <p>Topic: {currentSession.topic}</p>
            <Button variant="outline" onClick={() => router.push('/chat')}>
              Back to sessions
            </Button>
          </CardContent>
        </Card>

        {currentSession.isComplete ? <PerformanceSummaryCard session={currentSession} /> : null}
      </div>
    </div>
  );
}
