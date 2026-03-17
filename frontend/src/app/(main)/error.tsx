'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function MainError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-lg border border-destructive/40 bg-card p-6">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="mt-2 text-sm text-muted-foreground">Please try loading this page again.</p>
      <Button className="mt-4" onClick={reset}>
        Retry
      </Button>
    </div>
  );
}
