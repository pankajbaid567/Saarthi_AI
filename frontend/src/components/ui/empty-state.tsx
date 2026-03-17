import Link from 'next/link';

type EmptyStateProps = {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export function EmptyState({ title, description, ctaLabel, ctaHref }: EmptyStateProps) {
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/20 p-4 text-sm">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-muted-foreground">{description}</p>
      {ctaLabel && ctaHref ? (
        <Link href={ctaHref} className="mt-2 inline-block text-primary hover:underline">
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
