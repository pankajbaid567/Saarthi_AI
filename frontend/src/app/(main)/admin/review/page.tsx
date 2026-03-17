'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { week11Api, type AutoLinkReviewItem } from '@/lib/api-client';

const samplePayload = {
  concepts: [{ text: 'Fundamental rights protect liberty and equality in the Constitution.' }],
  facts: [{ text: 'Article 32 gives the right to constitutional remedies.' }],
  mcqs: [
    {
      question: 'Which article is known as the heart and soul of the Constitution?',
      options: ['Article 14', 'Article 19', 'Article 32', 'Article 226'],
    },
  ],
};

export default function AdminReviewPage() {
  const [items, setItems] = useState<AutoLinkReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await week11Api.listReviewItems();
      setItems(response.data);
    } catch {
      setMessage('Could not load review items. Ensure backend is running and you are logged in as admin.');
    } finally {
      setLoading(false);
    }
  }, []);

  const createSampleReviewItems = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await week11Api.autoLink(samplePayload);
      await load();
      setMessage('Sample extracted content auto-linked successfully.');
    } catch {
      setMessage('Failed to auto-link sample content.');
      setLoading(false);
    }
  };

  const approve = async (item: AutoLinkReviewItem) => {
    if (!item.topicSuggestion.topicId) {
      setMessage('No topic suggestion found. Create topic from backend API first.');
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await week11Api.approveReviewItem(item.id, { topicId: item.topicSuggestion.topicId });
      await load();
    } catch {
      setMessage('Failed to approve review item.');
      setLoading(false);
    }
  };

  const reject = async (item: AutoLinkReviewItem) => {
    setLoading(true);
    setMessage(null);
    try {
      await week11Api.rejectReviewItem(item.id);
      await load();
    } catch {
      setMessage('Failed to reject review item.');
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Week 11 Admin Review</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
          <Button type="button" onClick={() => void createSampleReviewItems()} disabled={loading}>
            Auto-link sample content
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Review extracted content, approve/reject links, and inspect enrichment outputs.
      </p>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      {items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No review items</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Run auto-linking to generate pending review items.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {item.type} · {item.status}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{item.text}</p>
                <p className="text-muted-foreground">
                  Match: {item.topicSuggestion.method} ({item.topicSuggestion.confidence})
                </p>
                {item.difficulty ? <p className="text-muted-foreground">Difficulty: {item.difficulty}</p> : null}
                {item.microNote ? <p className="text-muted-foreground">Micro note: {item.microNote}</p> : null}
                {item.smartHighlights.length > 0 ? (
                  <ul className="list-disc pl-6 text-muted-foreground">
                    {item.smartHighlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void approve(item)}
                    disabled={loading || item.status !== 'pending'}
                  >
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => void reject(item)}
                    disabled={loading || item.status !== 'pending'}
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
