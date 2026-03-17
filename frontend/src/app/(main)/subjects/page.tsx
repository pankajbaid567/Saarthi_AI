import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const subjects = [
  { id: 'biology', name: 'Biology', topics: 14 },
  { id: 'chemistry', name: 'Chemistry', topics: 12 },
  { id: 'physics', name: 'Physics', topics: 10 },
];

export default function SubjectsPage() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {subjects.map((subject) => (
        <Link key={subject.id} href={`/subjects/${subject.id}`}>
          <Card className="h-full transition hover:border-primary">
            <CardHeader>
              <CardTitle>{subject.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{subject.topics} topics</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
