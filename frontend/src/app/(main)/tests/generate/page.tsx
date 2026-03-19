'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createTest, getSubjects, getTopicsBySubject, TestType } from '@/lib/test-engine';

const testTypeOptions: { label: string; value: TestType }[] = [
  { label: 'Topic', value: 'topic' },
  { label: 'Mixed', value: 'mixed' },
  { label: 'PYQ', value: 'pyq' },
  { label: 'Weak-area', value: 'weak-area' },
];

export default function GenerateTestPage() {
  const router = useRouter();
  
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [topics, setTopics] = useState<{ id: string; name: string }[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  
  const [subjectId, setSubjectId] = useState('');
  const [type, setType] = useState<TestType>('topic');
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const loadedSubjects = await getSubjects();
        if (!active) return;
        setSubjects(loadedSubjects);
        if (loadedSubjects.length > 0) {
          setSubjectId(loadedSubjects[0].id);
        }
      } finally {
        if (active) setLoadingSubjects(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!subjectId) {
      setTopics([]);
      return;
    }
    let active = true;
    (async () => {
      try {
        const loadedTopics = await getTopicsBySubject(subjectId);
        if (active) setTopics(loadedTopics);
      } catch {
        if (active) setTopics([]);
      }
    })();
    return () => { active = false; };
  }, [subjectId]);

  const onSubjectChange = (value: string) => {
    setSubjectId(value);
    setSelectedTopicIds([]);
  };

  const onTopicToggle = (topicId: string) => {
    setSelectedTopicIds((current) => (current.includes(topicId) ? current.filter((id) => id !== topicId) : [...current, topicId]));
  };

  const [isGenerating, setIsGenerating] = useState(false);

  const onGenerate = async () => {
    setIsGenerating(true);
    try {
      const test = await createTest({
        type,
        subjectId,
        topicIds: selectedTopicIds,
        questionCount,
        timeLimitMinutes,
      });

      router.push(`/tests/${test.id}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loadingSubjects) {
     return <p className="text-sm text-muted-foreground p-4">Loading test configurations...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate MCQ Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-2">
          <label htmlFor="subject" className="text-sm font-medium">
            Subject
          </label>
          <select id="subject" value={subjectId} onChange={(event) => onSubjectChange(event.target.value)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </section>

        <section className="space-y-2">
          <p className="text-sm font-medium">Topics</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {topics.map((topic) => (
              <label key={topic.id} className="flex items-center gap-2 rounded border border-border p-2 text-sm">
                <input type="checkbox" checked={selectedTopicIds.includes(topic.id)} onChange={() => onTopicToggle(topic.id)} />
                {topic.name}
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <p className="text-sm font-medium">Test type</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {testTypeOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2 rounded border border-border p-2 text-sm">
                <input type="radio" name="testType" value={option.value} checked={type === option.value} onChange={() => setType(option.value)} />
                {option.label}
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <label htmlFor="questionCount" className="text-sm font-medium">
            Question count
          </label>
          <Input
            id="questionCount"
            type="number"
            min={5}
            max={50}
            value={questionCount}
            onChange={(event) => setQuestionCount(Math.max(5, Math.min(50, Number(event.target.value) || 5)))}
          />
        </section>

        <section className="space-y-2">
          <label htmlFor="timeLimit" className="text-sm font-medium">
            Time limit (minutes)
          </label>
          <select
            id="timeLimit"
            value={timeLimitMinutes}
            onChange={(event) => setTimeLimitMinutes(Number(event.target.value))}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          >
            {[15, 30, 45, 60, 90, 120].map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} minutes
              </option>
            ))}
          </select>
        </section>

        <Button type="button" onClick={() => void onGenerate()} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Start test'}
        </Button>
      </CardContent>
    </Card>
  );
}
