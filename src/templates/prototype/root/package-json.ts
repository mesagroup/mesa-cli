import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function render(config: PrototypeConfig): string {
  return JSON.stringify(
    {
      name: config.name,
      version: '0.1.0',
      description: config.description,
      author: config.author,
      private: true,
      packageManager: 'pnpm@10.9.0',
      engines: {
        node: '>=20',
        pnpm: '>=10',
      },
      scripts: {
        // Aggregate scripts. `pnpm dev` runs Next.js (which mounts Hono via API route).
        dev: 'pnpm --filter ./apps/web dev',
        'dev:api': 'pnpm --filter ./apps/api dev',
        build: 'pnpm -r build',
        start: 'pnpm --filter ./apps/web start',
        lint: 'pnpm -r lint',
        test: 'pnpm -r test',
        'db:generate': 'pnpm --filter ./packages/db generate',
        'db:push': 'pnpm --filter ./packages/db push',
        'db:migrate': 'pnpm --filter ./packages/db migrate',
        'db:studio': 'pnpm --filter ./packages/db studio',
      },
      devDependencies: {
        prettier: '^3.3.3',
        typescript: '^5.7.2',
      },
    },
    null,
    2
  ) + '\n';
}
