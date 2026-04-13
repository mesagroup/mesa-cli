import type { ScaffoldConfig } from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
  return JSON.stringify(
    {
      name: `${config.pluginName}-frontend`,
      version: '0.0.1',
      description: config.description,
      scripts: {
        start: 'ng serve --proxy-config proxy.conf.js',
        build: 'ng build --configuration production',
        test: 'ng test',
      },
      private: true,
      dependencies: {
        '@angular/animations': '^16.0.0',
        '@angular/common': '^16.0.0',
        '@angular/compiler': '^16.0.0',
        '@angular/core': '^16.0.0',
        '@angular/forms': '^16.0.0',
        '@angular/platform-browser': '^16.0.0',
        '@angular/platform-browser-dynamic': '^16.0.0',
        '@angular/router': '^16.0.0',
        rxjs: '~7.8.0',
        tslib: '^2.5.0',
        'zone.js': '~0.13.0',
      },
      devDependencies: {
        '@angular-architects/module-federation': '^16.0.0',
        '@angular-devkit/build-angular': '^16.0.0',
        '@angular/cli': '^16.0.0',
        '@angular/compiler-cli': '^16.0.0',
        '@types/node': '^18.0.0',
        typescript: '~5.1.0',
      },
    },
    null,
    2
  );
}
