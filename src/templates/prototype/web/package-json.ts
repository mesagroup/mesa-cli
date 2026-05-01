import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function render(config: PrototypeConfig): string {
  return JSON.stringify(
    {
      name: `${config.name}-web`,
      version: '0.1.0',
      private: true,
      type: 'module',
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
      },
      dependencies: {
        // Pinned to current LTS-y versions; update at will.
        next: '^15.2.0',
        react: '^19.0.0',
        'react-dom': '^19.0.0',
        // The Next.js app re-exports the Hono app from @<name>/api.
        [`@${config.name}/api`]: 'workspace:*',
        hono: '^4.6.14',
      },
      devDependencies: {
        '@tailwindcss/postcss': '^4.0.0',
        '@types/node': '^22.10.0',
        '@types/react': '^19.0.0',
        '@types/react-dom': '^19.0.0',
        postcss: '^8.4.49',
        tailwindcss: '^4.0.0',
        typescript: '^5.7.2',
      },
    },
    null,
    2
  ) + '\n';
}
