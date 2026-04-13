import type { ScaffoldConfig } from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
  const { pluginName } = config;

  const angularJson = {
    $schema: './node_modules/@angular/cli/lib/config/schema.json',
    version: 1,
    newProjectRoot: 'projects',
    projects: {
      [pluginName]: {
        projectType: 'application',
        root: '',
        sourceRoot: 'src',
        prefix: 'app',
        architect: {
          build: {
            builder: '@angular-architects/module-federation:webpack-browser',
            options: {
              outputPath: `dist/${pluginName}`,
              index: 'src/index.html',
              main: 'src/main.ts',
              polyfills: ['zone.js'],
              tsConfig: 'tsconfig.json',
              assets: ['src/favicon.ico', 'src/assets'],
              styles: ['src/styles.css'],
              scripts: [],
            },
            configurations: {
              production: {
                budgets: [
                  {
                    type: 'initial',
                    maximumWarning: '500kb',
                    maximumError: '1mb',
                  },
                  {
                    type: 'anyComponentStyle',
                    maximumWarning: '2kb',
                    maximumError: '4kb',
                  },
                ],
                outputHashing: 'all',
                optimization: true,
                sourceMap: false,
                namedChunks: false,
                extractLicenses: true,
              },
              development: {
                optimization: false,
                sourceMap: true,
                namedChunks: true,
                extractLicenses: false,
              },
            },
            defaultConfiguration: 'production',
          },
          serve: {
            builder: '@angular-architects/module-federation:webpack-dev-server',
            options: {
              proxyConfig: 'proxy.conf.js',
            },
            configurations: {
              production: {
                buildTarget: `${pluginName}:build:production`,
              },
              development: {
                buildTarget: `${pluginName}:build:development`,
              },
            },
            defaultConfiguration: 'development',
          },
          test: {
            builder: '@angular-devkit/build-angular:karma',
            options: {
              polyfills: ['zone.js', 'zone.js/testing'],
              tsConfig: 'tsconfig.json',
              assets: ['src/favicon.ico', 'src/assets'],
              styles: ['src/styles.css'],
              scripts: [],
            },
          },
        },
      },
    },
  };

  return JSON.stringify(angularJson, null, 2);
}
