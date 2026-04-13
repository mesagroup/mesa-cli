import type { ScaffoldConfig } from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
  return JSON.stringify(
    {
      name: `${config.pluginName}-backend`,
      version: '0.1.0',
      description: `${config.description} - Backend API`,
      author: config.author,
      private: true,
      scripts: {
        dev: 'nodemon',
        build: 'tsc',
        start: 'node dist/server.js',
      },
      dependencies: {
        cors: '^2.8.5',
        dotenv: '^16.4.7',
        express: '^4.21.2',
        helmet: '^8.0.0',
        jose: '^5.9.6',
        mssql: '^11.0.1',
        zod: '^3.24.2',
      },
      devDependencies: {
        '@types/cors': '^2.8.17',
        '@types/express': '^5.0.0',
        '@types/node': '^22.10.0',
        nodemon: '^3.1.9',
        'ts-node': '^10.9.2',
        typescript: '^5.7.2',
      },
    },
    null,
    2
  );
}
