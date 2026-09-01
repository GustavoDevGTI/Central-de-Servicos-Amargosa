import type { Metadata } from 'next';
import AmandaWidget from './amanda-widget';
import './globals.css';

const GOOGLE_TAG_MANAGER_ID = 'GTM-MRBCP7K8';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://central-servicos-amargosa.gustavoborges132.chatgpt.site'),
  title: 'Central de Serviços | Prefeitura de Amargosa',
  description: 'Encontre serviços públicos de Amargosa e acesse diretamente o canal oficial responsável.',
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
    <html lang="pt-BR">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GOOGLE_TAG_MANAGER_ID}');`,
          }}
        />
      </head>
      <body>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GOOGLE_TAG_MANAGER_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {children}
        <AmandaWidget />
      </body>
    </html>
  );
}
