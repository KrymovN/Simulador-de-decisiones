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
      <body>
        <div className="background"></div>
        <div className="overlay"></div>
        {children}
      </body>
    </html>
  );
}
