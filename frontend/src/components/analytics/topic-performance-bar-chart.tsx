import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TopicPerformanceBarChartProps = {
  topics: Array<{ subject: string; topic: string; accuracy: number; total: number }>;
};

export function TopicPerformanceBarChart({ topics }: TopicPerformanceBarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Topic-wise performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topics.map((item) => (
          <div key={`${item.subject}-${item.topic}`} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <p>
                {item.subject} / {item.topic}
              </p>
              <p className="text-muted-foreground">
                {item.accuracy}% ({item.total} Qs)
              </p>
            </div>
            <div className="h-2 rounded bg-slate-200">
              <div className="h-2 rounded bg-indigo-500" style={{ width: `${item.accuracy}%` }} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
