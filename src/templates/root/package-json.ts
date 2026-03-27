import type {ScaffoldConfig} from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
	const isSaas = config.projectType === 'saas';

	const scripts: Record<string, string> = isSaas
		? {
			dev: 'npm run dev --prefix backend',
			build: 'npm run build --prefix backend',
			start: 'npm run start --prefix backend',
			'install:all': 'npm install --prefix backend',
		}
		: {
			dev: 'aspire run',
			build: 'npm run build --prefix backend',
			start: 'node backend/dist/server.js',
			'install:all': 'npm install --prefix backend',
		};

	if (config.includeFrontend) {
		scripts.build += ' && npm run build --prefix frontend';
		scripts['install:all'] += ' && npm install --prefix frontend';
	}

	return JSON.stringify(
		{
			name: config.pluginName,
			version: '0.1.0',
			description: config.description,
			author: config.author,
			private: true,
			scripts,
		},
		null,
		2,
	) + '\n';
}
