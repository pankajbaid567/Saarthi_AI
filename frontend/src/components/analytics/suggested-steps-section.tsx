import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type SuggestedStepsSectionProps = {
  steps: string[];
};

export function SuggestedStepsSection({ steps }: SuggestedStepsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Suggested next steps</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="list-decimal space-y-1 pl-6 text-sm text-muted-foreground">
          {steps.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
