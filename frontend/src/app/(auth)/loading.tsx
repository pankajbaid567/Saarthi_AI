import { Skeleton } from '@/components/ui/skeleton';

export default function AuthLoading() {
  return (
    <div className="w-full max-w-md space-y-3 rounded-lg border border-border bg-card p-6">
      <Skeleton className="h-7 w-28" />
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
      <Skeleton className="h-10" />
    </div>
  );
}
