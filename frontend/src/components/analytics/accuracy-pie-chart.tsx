import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type AccuracyPieChartProps = {
  correctAnswers: number;
  incorrectAnswers: number;
  skippedAnswers: number;
};

export function AccuracyPieChart({ correctAnswers, incorrectAnswers, skippedAnswers }: AccuracyPieChartProps) {
  const total = Math.max(1, correctAnswers + incorrectAnswers + skippedAnswers);
  const correctPercent = (correctAnswers / total) * 100;
  const incorrectPercent = (incorrectAnswers / total) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Accuracy pie chart</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="mx-auto h-44 w-44 rounded-full"
          style={{
            background: `conic-gradient(#22c55e 0 ${correctPercent}%, #ef4444 ${correctPercent}% ${correctPercent + incorrectPercent}%, #94a3b8 ${correctPercent + incorrectPercent}% 100%)`,
          }}
        />
        <div className="grid grid-cols-3 gap-2 text-xs">
          <p className="rounded bg-green-100 p-2 text-center text-green-700">Correct: {correctAnswers}</p>
          <p className="rounded bg-red-100 p-2 text-center text-red-700">Incorrect: {incorrectAnswers}</p>
          <p className="rounded bg-slate-100 p-2 text-center text-slate-700">Skipped: {skippedAnswers}</p>
        </div>
      </CardContent>
    </Card>
  );
}
