import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ChatSession } from '@/lib/chat-api';

export function PerformanceSummaryCard({ session }: { session: ChatSession }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Performance Summary</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <p>
          Score: {session.performance.correct}/{session.performance.attempted}
        </p>
        <p>Accuracy: {session.performance.accuracy}%</p>
        <p>Difficulty level reached: {session.difficultyLevel}</p>
      </CardContent>
    </Card>
  );
}
