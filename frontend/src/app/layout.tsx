import type { Metadata } from 'next';
import Providers from '@/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Saarthi AI',
  description: 'Adaptive learning platform frontend shell',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href={apiOrigin} />
        <link rel="dns-prefetch" href={apiOrigin} />
      </head>
      <body className="bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
