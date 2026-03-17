import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type AiInsightsCardProps = {
  insights: string;
};

export function AiInsightsCard({ insights }: AiInsightsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">AI insights</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{insights}</p>
      </CardContent>
    </Card>
  );
}
