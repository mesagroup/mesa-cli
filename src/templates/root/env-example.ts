import type {ScaffoldConfig} from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
	const lines = [
		`# =============================================================================`,
		`# ${config.pluginName} - Environment Variables`,
		`# =============================================================================`,
		`# Copy this file to .env and fill in real values.`,
		`# When running with Aspire, most of these are injected automatically.`,
		``,
		`# -- Database (SQL Server) --`,
		`DB_HOST=localhost`,
		`DB_PORT=1433`,
		`DB_USER=sa`,
		`DB_PASSWORD=YourStrong!Passw0rd`,
		`DB_NAME=plugindb`,
		`# Full connection string (overrides individual fields when set)`,
		`# DATABASE_URL=Server=localhost,1433;Database=plugindb;User Id=sa;Password=YourStrong!Passw0rd;TrustServerCertificate=true`,
		``,
		`# -- Authentication --`,
		`JWT_SECRET=replace-with-a-random-secret`,
		`JWT_ISSUER=https://mesa.example.com`,
		`JWT_AUDIENCE=mesa-plugin`,
		``,
		`# -- Server --`,
		`PORT=3000`,
		`NODE_ENV=development`,
		``,
		`# -- CORS --`,
		`CORS_ORIGIN=http://localhost:4200`,
		``,
		`# -- Aspire (auto-injected at runtime) --`,
		`# ASPIRE_SERVICE_NAME=api`,
		`# OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317`,
		``,
	];

	return lines.join('\n');
}
