import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Gera um servidor Node autocontido para Docker, VM e Portainer.
  output: 'standalone',
};

export default nextConfig;
