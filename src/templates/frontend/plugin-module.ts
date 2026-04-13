import type { ScaffoldConfig } from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
  const { pluginName, pluginClassName } = config;

  return `import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ${pluginClassName}Component } from './${pluginName}.component';

@NgModule({
  declarations: [${pluginClassName}Component],
  imports: [CommonModule],
  exports: [${pluginClassName}Component],
})
export class ${pluginClassName}Module {}
`;
}
