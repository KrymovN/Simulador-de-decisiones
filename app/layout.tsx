import './styles/dashboard.css';
import './styles/auth.css';
import './styles/simulator.css';
import './globals.css';
import './styles/motion.css';
import type { Metadata } from 'next';
import type { Viewport } from 'next';
import { AuthRuntimeProvider } from '../components/auth/AuthRuntimeProvider';

const siteName = 'Levio.es';
const siteTitle = 'Levio.es';
const siteDescription =
  'Sistema de inteligencia de decisiones para analizar escenarios, riesgos y consecuencias antes de actuar.';
const siteUrl = 'https://levio.es';
const faviconUrl = '/levio-favicon-v3.ico';
const appleIconUrl = '/levio-apple-touch-icon-v3.png';
const icon512Url = '/levio-icon-512-v3.png';
const manifestUrl = '/levio-manifest-v3.webmanifest';

export const metadata: Metadata = {
  title: {
    default: siteTitle,
    template: `%s | ${siteName}`,
  },
  applicationName: siteName,
  description: siteDescription,
  metadataBase: new URL(siteUrl),
  manifest: manifestUrl,
  icons: {
    icon: [{ url: faviconUrl, sizes: '64x64', type: 'image/x-icon' }],
    shortcut: [{ url: faviconUrl, sizes: '64x64', type: 'image/x-icon' }],
    apple: [{ url: appleIconUrl, type: 'image/png', sizes: '180x180' }],
  },
  appleWebApp: {
    capable: true,
    title: siteName,
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName,
    images: [
      {
        url: icon512Url,
        width: 512,
        height: 512,
        alt: siteName,
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: icon512Url,
        width: 512,
        height: 512,
        alt: siteName,
      },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'dark',
  themeColor: '#000000',
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
        <AuthRuntimeProvider>{children}</AuthRuntimeProvider>
      </body>
    </html>
  );
}
