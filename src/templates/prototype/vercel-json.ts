import type { PrototypeConfig } from '../../generators/prototype-scaffold';

export function render(_config: PrototypeConfig): string {
  return JSON.stringify(
    {
      $schema: 'https://openapi.vercel.sh/vercel.json',
      buildCommand: 'pnpm build',
      // NOTE: lockfile-agnostic install so the very first deploy works
      // without a committed pnpm-lock.yaml. Run 'pnpm install' locally and
      // commit the lockfile, then swap to a frozen install for reproducible
      // builds.
      installCommand: 'pnpm install',
      outputDirectory: 'apps/web/.next',
      framework: 'nextjs',
    },
    null,
    2
  ) + '\n';
}
