import type { Metadata } from 'next';
import './globals.css';

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
      <body>{children}</body>
    </html>
  );
}
