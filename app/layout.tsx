import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Levio',
  description: 'AI-powered platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="background"></div>
        <div className="overlay"></div>
        {children}
      </body>
    </html>
  );
}
