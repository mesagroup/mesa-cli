import type { ScaffoldConfig } from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
  const isSaas = config.projectType === 'saas';

  const lines = [
    `# Environment Variables - ${config.pluginName}`,
    ``,
    `## Database`,
    ``,
    `| Variable | Description | Required | Example |`,
    `|----------|-------------|----------|---------|`,
    `| \`DB_SERVER\` | SQL Server hostname | Yes | \`localhost\` |`,
    `| \`DB_NAME\` | Database name | Yes | \`plugindb\` |`,
    `| \`DB_USER\` | Database user | Yes | \`sa\` |`,
    `| \`DB_PASSWORD\` | Database password | Yes | \`YourStrong!Passw0rd\` |`,
  ];

  if (!isSaas) {
    lines.push(
      `| \`DB_HOST\` | SQL Server hostname (alias) | No | \`localhost\` |`,
      `| \`DB_PORT\` | SQL Server port | No (default: 1433) | \`1433\` |`,
      `| \`DATABASE_URL\` | Full connection string (overrides individual fields) | No | \`Server=localhost,1433;Database=plugindb;...\` |`
    );
  }

  lines.push(
    ``,
    `## Authentication`,
    ``,
    `| Variable | Description | Required | Example |`,
    `|----------|-------------|----------|---------|`,
    `| \`JWT_SECRET\` | Secret key for JWT signing/verification | Yes | \`a-random-256-bit-secret\` |`,
    `| \`JWT_ISSUER\` | Expected JWT issuer claim | Yes | \`https://mesa.example.com\` |`,
    `| \`JWT_AUDIENCE\` | Expected JWT audience claim | Yes | \`mesa-plugin\` |`,
    ``,
    `## CORS`,
    ``,
    `| Variable | Description | Required | Example |`,
    `|----------|-------------|----------|---------|`,
    `| \`CORS_ORIGINS\` | Allowed origin(s), comma-separated | Yes | \`http://localhost:4200\` |`,
    ``
  );

  if (isSaas) {
    lines.push(
      `## Azure Functions`,
      ``,
      `These are configured in \`local.settings.json\` locally and in Azure App Settings for production.`,
      ``,
      `| Variable | Description | Required | Example |`,
      `|----------|-------------|----------|---------|`,
      `| \`FUNCTIONS_WORKER_RUNTIME\` | Functions runtime | Yes (auto) | \`node\` |`,
      `| \`AzureWebJobsStorage\` | Storage connection for Functions | Yes | \`UseDevelopmentStorage=true\` |`,
      ``
    );
  } else {
    lines.push(
      `## Server`,
      ``,
      `| Variable | Description | Required | Example |`,
      `|----------|-------------|----------|---------|`,
      `| \`PORT\` | HTTP server port | No (default: 3000) | \`3000\` |`,
      `| \`NODE_ENV\` | Runtime environment | No (default: development) | \`production\` |`,
      ``,
      `## Aspire (auto-injected)`,
      ``,
      `These variables are automatically injected by the Aspire host at runtime.`,
      `You do **not** need to set them manually.`,
      ``,
      `| Variable | Description | Required | Example |`,
      `|----------|-------------|----------|---------|`,
      `| \`ASPIRE_SERVICE_NAME\` | Logical service name in the Aspire app model | No (auto) | \`api\` |`,
      `| \`OTEL_EXPORTER_OTLP_ENDPOINT\` | OpenTelemetry collector endpoint | No (auto) | \`http://localhost:4317\` |`,
      ``
    );
  }

  return lines.join('\n');
}
