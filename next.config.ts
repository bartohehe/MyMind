import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Wymagane przez obraz Dockera — buduje minimalny serwer w .next/standalone.
  output: 'standalone',
  // better-sqlite3 to moduł natywny: nie może być bundlowany, musi być wymagany w runtime.
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
