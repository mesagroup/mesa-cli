import type { ScaffoldConfig } from '../../types/scaffold';
import { getDbModule } from '../db';

export function render(config: ScaffoldConfig): string {
  const db = getDbModule(config);
  const usesAspire = !(config.database === 'mongodb' && config.mongoMode === 'atlas');

  const baseDeps: Record<string, string> = {
    next: '^15.2.0',
    react: '^19.0.0',
    'react-dom': '^19.0.0',
    dotenv: '^16.4.7',
    jose: '^5.9.6',
    zod: '^3.24.2',
  };

  if (usesAspire) {
    baseDeps['vscode-jsonrpc'] = '^8.2.0';
  }

  return JSON.stringify(
    {
      name: config.pluginName,
      version: '0.1.0',
      description: config.description,
      author: config.author,
      private: true,
      type: 'module',
      scripts: {
        // next dev/start read PORT from env natively (cross-platform)
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
      },
      dependencies: { ...baseDeps, ...db.getDependencies() },
      devDependencies: {
        '@tailwindcss/postcss': '^4.0.0',
        '@types/node': '^22.10.0',
        '@types/react': '^19.0.0',
        '@types/react-dom': '^19.0.0',
        postcss: '^8.4.49',
        tailwindcss: '^4.0.0',
        typescript: '^5.7.2',
        ...db.getDevDependencies(),
      },
    },
    null,
    2
  );
}
