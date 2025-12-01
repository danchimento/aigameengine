import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'What do you want to do?',
  description: 'A text-based AI game engine',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
