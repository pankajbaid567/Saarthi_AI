import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TimeDistributionHistogramProps = {
  buckets: Array<{ label: string; count: number }>;
};

export function TimeDistributionHistogram({ buckets }: TimeDistributionHistogramProps) {
  const maxCount = Math.max(1, ...buckets.map((item) => item.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Time distribution histogram</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-3">
          {buckets.map((bucket) => (
            <div key={bucket.label} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t bg-blue-500"
                style={{ height: `${Math.max(12, (bucket.count / maxCount) * 120)}px` }}
                title={`${bucket.label}: ${bucket.count}`}
              />
              <p className="text-xs text-muted-foreground">{bucket.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
