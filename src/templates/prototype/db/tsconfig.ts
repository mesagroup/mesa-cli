import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function render(_config: PrototypeConfig): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        esModuleInterop: true,
        strict: true,
        skipLibCheck: true,
        resolveJsonModule: true,
        outDir: './dist',
        declaration: true,
        sourceMap: true,
        types: ['node'],
      },
      include: ['src/**/*', 'drizzle.config.ts'],
      exclude: ['node_modules', 'dist'],
    },
    null,
    2
  ) + '\n';
}
