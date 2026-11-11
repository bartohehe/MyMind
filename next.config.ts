import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Wymagane przez obraz Dockera — buduje minimalny serwer w .next/standalone.
  output: 'standalone',
  // Sterownik Postgresa wymagamy w runtime zamiast go bundlować
  // (ma opcjonalny `pg-native`, którego webpack nie powinien szukać).
  serverExternalPackages: ['pg'],
};

export default nextConfig;
