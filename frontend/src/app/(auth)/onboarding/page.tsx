'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const subjectOptions = ['Polity', 'History', 'Geography', 'Economy', 'Environment', 'Science & Tech'];

const stepTitles = [
  'Welcome screen',
  'Target exam date selection',
  'Optional subject selection',
  'Initial assessment quiz',
  'Syllabus progress initialization (SyllabusFlow)',
  'Dashboard tutorial',
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [examDate, setExamDate] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [assessmentScore, setAssessmentScore] = useState('3');
  const [error, setError] = useState<string | null>(null);

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) => (prev.includes(subject) ? prev.filter((value) => value !== subject) : [...prev, subject]));
  };

  const completeOnboarding = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('onboardingComplete', 'true');
    }
    toast.success('Onboarding completed. Your dashboard is ready.');
    router.push('/dashboard');
  };

  const isFinalStep = step === stepTitles.length - 1;

  const goToNextStep = () => {
    if (step === 1 && !examDate) {
      setError('Please select your target exam date before proceeding.');
      return;
    }

    setError(null);
    setStep((value) => value + 1);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{stepTitles[step]}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 0 ? (
          <div className="space-y-3">
            <Image src="/next.svg" alt="Saarthi AI onboarding" width={120} height={24} priority />
            <p className="text-sm text-muted-foreground">
              Welcome to Saarthi AI. This guided setup personalizes your plan for revision, practice, mains, and strategy reminders.
            </p>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-2">
            <label htmlFor="exam-date" className="text-sm font-medium">
              Select your target exam date
            </label>
            <Input id="exam-date" type="date" value={examDate} onChange={(event) => setExamDate(event.target.value)} required />
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Choose optional subjects (you can update this later).</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {subjectOptions.map((subject) => (
                <label key={subject} className="flex items-center gap-2 rounded border border-border p-2 text-sm">
                  <input type="checkbox" checked={selectedSubjects.includes(subject)} onChange={() => toggleSubject(subject)} />
                  {subject}
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Quick self-assessment: how confident are you with the current syllabus?</p>
            <Input
              type="number"
              min={1}
              max={5}
              value={assessmentScore}
              onChange={(event) => setAssessmentScore(event.target.value)}
              placeholder="1 (low) - 5 (high)"
            />
          </div>
        ) : null}

        {step === 4 ? (
          <div className="rounded-md border border-border bg-muted/20 p-3 text-sm">
            <p className="font-medium">SyllabusFlow initialization complete</p>
            <p className="mt-1 text-muted-foreground">
              Saarthi has created your initial completion map and will prioritize daily practice from completed topics first.
            </p>
          </div>
        ) : null}

        {step === 5 ? (
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Use dashboard cards to load revision predictions and sprint targets.</li>
            <li>• Open Notifications for revision, practice, mains-gate, plan, streak, content, and essay reminders.</li>
            <li>• Use Focus mode for distraction-free reading and answer writing.</li>
          </ul>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex items-center justify-between">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>
            Back
          </Button>
          {isFinalStep ? (
            <Button onClick={completeOnboarding}>Finish and open dashboard</Button>
          ) : (
            <Button onClick={goToNextStep}>Next</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
