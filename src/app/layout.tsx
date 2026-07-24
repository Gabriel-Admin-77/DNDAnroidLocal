import type { Metadata } from 'next';
import { Inter, Cinzel } from 'next/font/google';
import './globals.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const cinzel = Cinzel({
  variable: '--font-cinzel',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'D&D AI Game Master',
  description: 'Embark on dynamic RPG adventures with an AI Dungeon Master.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${cinzel.variable} antialiased bg-stone-950 text-stone-200 min-h-screen`}
      >
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
