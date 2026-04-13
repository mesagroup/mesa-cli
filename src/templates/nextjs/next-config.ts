import type { ScaffoldConfig } from '../../types/scaffold';

export function render(_config: ScaffoldConfig): string {
  return `import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

export default nextConfig;
`;
}
