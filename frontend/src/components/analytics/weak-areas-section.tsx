import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type WeakAreasSectionProps = {
  weakAreas: string[];
};

export function WeakAreasSection({ weakAreas }: WeakAreasSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Weak areas</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc space-y-1 pl-6 text-sm text-muted-foreground">
          {weakAreas.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
