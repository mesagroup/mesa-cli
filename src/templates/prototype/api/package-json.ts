import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function render(config: PrototypeConfig): string {
  return JSON.stringify(
    {
      name: `@${config.name}/api`,
      version: '0.1.0',
      private: true,
      type: 'module',
      main: './src/app.ts',
      types: './src/app.ts',
      exports: {
        '.': './src/app.ts',
      },
      scripts: {
        // Standalone Hono dev server (alternate to running via Next.js).
        dev: 'tsx watch src/server.ts',
        build: 'tsc',
        test: 'vitest run',
      },
      dependencies: {
        hono: '^4.6.14',
        '@hono/node-server': '^1.13.7',
        '@hono/zod-validator': '^0.4.2',
        zod: '^3.24.2',
        jose: '^5.9.6',
        bcryptjs: '^2.4.3',
        '@vercel/blob': '^0.27.0',
        // drizzle-orm is re-exported from @<name>/db for shared types/queries
        // (e.g. eq, sql), so apps/api needs it as a direct dep too.
        'drizzle-orm': '^0.36.4',
        [`@${config.name}/db`]: 'workspace:*',
      },
      devDependencies: {
        '@types/bcryptjs': '^2.4.6',
        '@types/node': '^22.10.0',
        tsx: '^4.19.2',
        typescript: '^5.7.2',
        vitest: '^2.1.8',
      },
    },
    null,
    2
  ) + '\n';
}
