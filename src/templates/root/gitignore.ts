import type {ScaffoldConfig} from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
	const lines = [
		'# Environment',
		'.env',
		'.env.local',
		'.env.*.local',
		'',
		'# Dependencies',
		'node_modules/',
		'',
		'# Build output',
		'dist/',
		'build/',
		'',
	];

	if (config.projectType === 'standalone') {
		lines.push('# Aspire', '.modules/', '', '# Next.js', '.next/', '');
	} else if (config.projectType === 'saas') {
		lines.push('# Azure Functions', 'local.settings.json', '');
	} else {
		lines.push('# Aspire', '.modules/', '');
	}

	lines.push('# Logs', '*.log', '', '# OS files', '.DS_Store', 'Thumbs.db', '');

	return lines.join('\n');
}
