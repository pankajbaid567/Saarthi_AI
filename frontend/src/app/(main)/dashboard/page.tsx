import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const cards = [
  { title: 'Subjects enrolled', value: '6' },
  { title: 'Topics completed', value: '24' },
  { title: 'Current streak', value: '8 days' },
];

export default function DashboardPage() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader>
            <CardTitle className="text-base">{card.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
