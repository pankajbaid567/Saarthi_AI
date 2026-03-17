import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const topicMap: Record<string, { id: string; name: string }[]> = {
  biology: [
    { id: 'cell-biology', name: 'Cell Biology' },
    { id: 'genetics', name: 'Genetics' },
  ],
  chemistry: [
    { id: 'organic-chemistry', name: 'Organic Chemistry' },
    { id: 'electrochemistry', name: 'Electrochemistry' },
  ],
};

export default async function SubjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const topics = topicMap[id] ?? [{ id: 'sample-topic', name: 'Sample Topic' }];

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold capitalize">{id}</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic) => (
          <Link key={topic.id} href={`/topics/${topic.id}`}>
            <Card className="transition hover:border-primary">
              <CardHeader>
                <CardTitle>{topic.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Open topic</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
