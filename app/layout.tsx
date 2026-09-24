import type { Metadata } from 'next';
import AmandaWidget from './amanda-widget';
import GoogleTagManager from './google-tag-manager';
import VlibrasWidget from './vlibras-widget';
import './globals.css';

const GOOGLE_TAG_MANAGER_ID = 'GTM-MRBCP7K8';

const ACCESSIBILITY_PREFERENCES_SCRIPT = `
  (function () {
    try {
      var stored = localStorage.getItem('amargosa-accessibility-preferences');
      var preferences = stored ? JSON.parse(stored) : {};
      var textSize = ['small', 'default', 'large'].indexOf(preferences.textSize) >= 0
        ? preferences.textSize
        : 'default';
      document.documentElement.dataset.textSize = textSize;
      document.documentElement.dataset.highContrast = String(preferences.highContrast === true);
    } catch (error) {
      document.documentElement.dataset.textSize = 'default';
      document.documentElement.dataset.highContrast = 'false';
    }
  })();
`;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://central-servicos-amargosa.gustavoborges132.chatgpt.site'),
  title: 'Central de Serviços | Prefeitura de Amargosa',
  description: 'Central oficial de informações e acesso aos serviços públicos da Prefeitura de Amargosa.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'Central de Serviços de Amargosa',
    description: 'O caminho certo para cada serviço público.',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Central de Serviços de Amargosa' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Central de Serviços de Amargosa',
    description: 'O caminho certo para cada serviço público.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ACCESSIBILITY_PREFERENCES_SCRIPT }} />
      </head>
      <body>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GOOGLE_TAG_MANAGER_ID}`}
            title="Google Tag Manager"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        <GoogleTagManager id={GOOGLE_TAG_MANAGER_ID} />
        <VlibrasWidget />
        {children}
        <AmandaWidget />
      </body>
    </html>
  );
}
