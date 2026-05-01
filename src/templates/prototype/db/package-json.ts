import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function render(config: PrototypeConfig): string {
  return JSON.stringify(
    {
      name: `@${config.name}/db`,
      version: '0.1.0',
      private: true,
      type: 'module',
      main: './src/index.ts',
      types: './src/index.ts',
      exports: {
        '.': './src/index.ts',
      },
      scripts: {
        generate: 'drizzle-kit generate',
        push: 'drizzle-kit push',
        migrate: 'drizzle-kit migrate',
        studio: 'drizzle-kit studio',
      },
      dependencies: {
        '@neondatabase/serverless': '^0.10.4',
        'drizzle-orm': '^0.36.4',
      },
      devDependencies: {
        'drizzle-kit': '^0.28.0',
        '@types/node': '^22.10.0',
        typescript: '^5.7.2',
      },
    },
    null,
    2
  ) + '\n';
}
