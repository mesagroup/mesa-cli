import type {ScaffoldConfig} from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
	const lines = [
		`import { DistributedApplication } from '@aspire/hosting';`,
		``,
		`const builder = DistributedApplication.createBuilder();`,
		``,
		`// SQL Server container`,
		`const sql = await builder.addSqlServer('sql');`,
		`const sqldb = await sql.addDatabase('plugindb');`,
		``,
		`// Express backend`,
		`const api = await builder`,
		`  .addNodeApp('api', './backend', 'src/server.ts')`,
		`  .withReference(sqldb)`,
		`  .withHttpEndpoint({ port: 3000, env: 'PORT' });`,
	];

	if (config.includeFrontend) {
		const isStandalone = config.projectType === 'standalone';
		const frontendComment = isStandalone ? '// Next.js frontend' : '// Angular frontend';
		const frontendScript = isStandalone ? 'dev' : 'start';
		const frontendPort = isStandalone ? 3001 : 4200;
		lines.push(
			``,
			frontendComment,
			`const web = await builder`,
			`  .addNpmApp('web', './frontend', '${frontendScript}')`,
			`  .withReference(api)`,
			`  .withHttpEndpoint({ port: ${frontendPort}, env: 'PORT' });`,
		);
	}

	lines.push(``, `await builder.build().runAsync();`, ``);

	return lines.join('\n');
}
