import type {ScaffoldConfig} from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
	const {pluginName, pluginClassName} = config;

	return `import { Component } from '@angular/core';

@Component({
  selector: 'app-${pluginName}',
  template: \`
    <div class="${pluginName}-root">
      <h1>${pluginClassName} Plugin</h1>
    </div>
  \`,
})
export class ${pluginClassName}Component {}
`;
}
