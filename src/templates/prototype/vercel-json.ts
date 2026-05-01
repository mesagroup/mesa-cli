import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function render(_config: PrototypeConfig): string {
  return JSON.stringify(
    {
      $schema: 'https://openapi.vercel.sh/vercel.json',
      buildCommand: 'pnpm build',
      installCommand: 'pnpm install --frozen-lockfile',
      outputDirectory: 'apps/web/.next',
      framework: 'nextjs',
    },
    null,
    2
  ) + '\n';
}
