import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function render(_config: PrototypeConfig): string {
  return `import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The Hono API is mounted under /api/[...route]/route.ts and shares the
  // same deployment as the Next.js app. No rewrites needed.
  experimental: {
    // Enable typed routes if desired.
  },
};

export default nextConfig;
`;
}
