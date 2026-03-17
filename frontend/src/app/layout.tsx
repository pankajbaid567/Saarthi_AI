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
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
