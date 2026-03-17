import { cn } from '@/lib/utils';

type TooltipProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
};

export function Tooltip({ label, children, className }: TooltipProps) {
  return (
    <span className={cn('group relative inline-flex', className)} aria-label={label}>
      {children}
      <span
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background group-hover:block"
        role="tooltip"
        aria-hidden="true"
      >
        {label}
      </span>
    </span>
  );
}
