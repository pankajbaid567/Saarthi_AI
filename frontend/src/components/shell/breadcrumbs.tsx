'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link href="/dashboard" className="hover:text-foreground">
            Dashboard
          </Link>
        </li>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join('/')}`;
          const label = decodeURIComponent(segment).replace(/-/g, ' ');
          const isLast = index === segments.length - 1;

          return (
            <li key={href} className="flex items-center gap-2">
              <span>/</span>
              {isLast ? <span className="capitalize text-foreground">{label}</span> : <Link href={href} className="capitalize hover:text-foreground">{label}</Link>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
