import type { ScaffoldConfig } from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
  const { pluginName, pluginClassName } = config;

  return `export { ${pluginClassName}Module } from './lib/${pluginName}.module';
export { ${pluginClassName}Component } from './lib/${pluginName}.component';
export { Configuration, InputData } from './lib/models';
`;
}
