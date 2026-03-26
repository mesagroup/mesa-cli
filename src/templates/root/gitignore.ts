import type {ScaffoldConfig} from '../../types/scaffold';

export function render(_config: ScaffoldConfig): string {
	return [
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
		'# Aspire',
		'.modules/',
		'',
		'# Logs',
		'*.log',
		'',
		'# OS files',
		'.DS_Store',
		'Thumbs.db',
		'',
	].join('\n');
}
