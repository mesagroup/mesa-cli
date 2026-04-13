import type { ScaffoldConfig } from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
  return JSON.stringify(
    {
      name: `${config.pluginName}-backend`,
      version: '0.1.0',
      description: `${config.description} - Azure Functions Backend`,
      author: config.author,
      private: true,
      scripts: {
        build: 'tsc',
        start: 'func start',
        dev: 'func start --typescript',
        test: 'jest',
        lint: 'eslint src/',
      },
      dependencies: {
        '@azure/functions': '^4.6.0',
        jose: '^5.9.6',
        mssql: '^11.0.1',
        zod: '^3.24.2',
      },
      devDependencies: {
        '@types/jest': '^29.5.14',
        '@types/node': '^22.10.0',
        eslint: '^9.17.0',
        jest: '^29.7.0',
        'ts-jest': '^29.2.5',
        typescript: '~5.4.5',
      },
    },
    null,
    2
  );
}
