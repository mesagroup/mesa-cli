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
		lines.push(
			``,
			`// Angular frontend`,
			`const web = await builder`,
			`  .addNpmApp('web', './frontend', 'start')`,
			`  .withReference(api)`,
			`  .withHttpEndpoint({ port: 4200, env: 'PORT' });`,
		);
	}

	lines.push(``, `await builder.build().runAsync();`, ``);

	return lines.join('\n');
}
