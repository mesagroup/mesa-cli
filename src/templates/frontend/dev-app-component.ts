import type { ScaffoldConfig } from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
  const { pluginName } = config;

  return `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: '<app-${pluginName}></app-${pluginName}>',
})
export class AppComponent {}
`;
}
