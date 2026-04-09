import type {ScaffoldConfig} from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
	return JSON.stringify(
		{
			name: config.pluginName,
			version: '1.0.0',
			language: 'typescript',
		},
		null,
		2,
	) + '\n';
}
