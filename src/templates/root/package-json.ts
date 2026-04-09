import type {ScaffoldConfig} from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
	const { projectType } = config;

	let scripts: Record<string, string>;

	if (projectType === 'standalone') {
		scripts = {
			dev: 'aspire run',
			build: 'npm run build --prefix backend',
			start: 'node backend/dist/server.js',
			'install:all': 'npm install --prefix backend',
		};
	} else if (projectType === 'saas') {
		scripts = {
			dev: 'npm run dev --prefix backend',
			build: 'npm run build --prefix backend',
			start: 'npm run start --prefix backend',
			'install:all': 'npm install --prefix backend',
		};
	} else {
		scripts = {
			dev: 'aspire run',
			build: 'npm run build --prefix backend',
			start: 'node backend/dist/server.js',
			'install:all': 'npm install --prefix backend',
		};
	}

	if (config.includeFrontend) {
		scripts.build += ' && npm run build --prefix frontend';
		scripts['install:all'] += ' && npm install --prefix frontend';
	}

	const usesAspire = projectType !== 'saas';

	const pkg: Record<string, unknown> = {
		name: config.pluginName,
		version: '0.1.0',
		description: config.description,
		author: config.author,
		private: true,
		type: 'module',
		scripts,
	};

	if (usesAspire) {
		pkg.dependencies = {
			'vscode-jsonrpc': '^8.2.0',
		};
	}

	return JSON.stringify(pkg, null, 2) + '\n';
}
