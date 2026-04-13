import type { ScaffoldConfig } from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
  return JSON.stringify(
    {
      name: `${config.pluginName}-frontend`,
      version: '0.1.0',
      description: `${config.description} - Frontend`,
      author: config.author,
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
      },
      dependencies: {
        next: '^15.2.0',
        react: '^19.0.0',
        'react-dom': '^19.0.0',
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
  );
}
