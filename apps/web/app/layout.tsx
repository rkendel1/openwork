import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Openwork - AI Coworker',
  description: 'The open source AI coworker that works for you',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
