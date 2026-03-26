import type { ScaffoldConfig } from '../../types/scaffold';

export function render(_config: ScaffoldConfig): string {
	return JSON.stringify(
		{
			watch: ['src'],
			ext: 'ts',
			exec: 'ts-node src/server.ts',
		},
		null,
		2,
	);
}
