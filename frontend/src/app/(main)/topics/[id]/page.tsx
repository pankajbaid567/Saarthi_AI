'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const sampleMarkdown = `# Cell Biology\n\nCells are the **basic structural and functional unit** of life.\n\n## Core ideas\n\n- Cell membrane controls transport\n- Nucleus stores genetic material\n- Mitochondria generate ATP\n`;

export default function TopicPage() {
  const [fontSize, setFontSize] = useState(16);
  const [focusMode, setFocusMode] = useState(false);

  return (
    <div className={focusMode ? 'mx-auto max-w-3xl' : ''}>
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-3">
            <span>Topic Reading</span>
            <div className="flex items-center gap-2 text-sm font-normal">
              <label htmlFor="font-size">Font size</label>
              <input
                id="font-size"
                type="range"
                min={14}
                max={22}
                value={fontSize}
                onChange={(event) => setFontSize(Number(event.target.value))}
              />
              <button type="button" className="rounded border border-border px-2 py-1" onClick={() => setFocusMode((prev) => !prev)}>
                {focusMode ? 'Exit focus mode' : 'Focus mode'}
              </button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="concept-notes">
            <TabsList>
              <TabsTrigger value="concept-notes">Concept Notes</TabsTrigger>
              <TabsTrigger value="pyqs">PYQs</TabsTrigger>
              <TabsTrigger value="smart-highlights">Smart Highlights</TabsTrigger>
              <TabsTrigger value="micro-notes">Micro Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="concept-notes">
              <article className="prose max-w-none dark:prose-invert" style={{ fontSize }}>
                <ReactMarkdown>{sampleMarkdown}</ReactMarkdown>
              </article>
            </TabsContent>
            <TabsContent value="pyqs">
              <ul className="list-disc space-y-2 pl-6 text-sm">
                <li>Explain differences between prokaryotic and eukaryotic cells.</li>
                <li>Describe transport through the plasma membrane.</li>
              </ul>
            </TabsContent>
            <TabsContent value="smart-highlights">
              <p className="text-sm text-muted-foreground">AI generated highlights will appear here.</p>
            </TabsContent>
            <TabsContent value="micro-notes">
              <p className="text-sm text-muted-foreground">Quick revision notes will appear here.</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
