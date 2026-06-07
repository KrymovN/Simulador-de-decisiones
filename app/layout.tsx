import './styles/dashboard.css';
import './styles/auth.css';
import './styles/simulator.css';
import './globals.css';
import './styles/motion.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'levio.es',
  description: 'AI decision-simulation platform',
  metadataBase: new URL('https://levio.es'),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-icon.png', type: 'image/png', sizes: '180x180' }],
  },
  openGraph: {
    title: 'levio.es',
    description: 'AI decision-simulation platform',
    url: 'https://levio.es',
    siteName: 'levio.es',
    images: [
      {
        url: '/icon.png',
        width: 512,
        height: 512,
        alt: 'levio.es',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico?v=2.8j-fix" sizes="64x64" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico?v=2.8j-fix" type="image/x-icon" />
        <link rel="icon" href="/icon-192.png?v=2.8j-fix" sizes="192x192" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-icon.png?v=2.8j-fix" sizes="180x180" />
        <link rel="manifest" href="/manifest.webmanifest?v=2.8j-fix" />
      </head>
      <body>
        <div className="background"></div>
        <div className="overlay"></div>
        {children}
      </body>
    </html>
  );
}
