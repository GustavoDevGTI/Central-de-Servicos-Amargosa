import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Gera um servidor Node autocontido para Docker, VM e Portainer.
  output: 'standalone',
  allowedDevOrigins: [
    'maisdigital.amargosa.ba.gov.br',
    'servicos.amargosa.ba.gov.br',
  ],
};

export default nextConfig;
