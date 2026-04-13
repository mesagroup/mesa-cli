import type { ScaffoldConfig } from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
  const header = [
    `# =============================================================================`,
    `# ${config.pluginName} - Environment Variables`,
    `# =============================================================================`,
    `# Copy this file to .env and fill in real values.`,
  ];

  if (config.projectType === 'saas') {
    return [
      ...header,
      `# For Azure Functions, use local.settings.json locally.`,
      `# In production, use Azure App Settings / Key Vault.`,
      ``,
      `# -- Database (SQL Server) --`,
      `DB_SERVER=localhost`,
      `DB_NAME=plugindb`,
      `DB_USER=sa`,
      `DB_PASSWORD=YourStrong!Passw0rd`,
      ``,
      `# -- Authentication --`,
      `JWT_SECRET=replace-with-a-random-secret`,
      `JWT_ISSUER=https://mesa.example.com`,
      `JWT_AUDIENCE=mesa-plugin`,
      ``,
      `# -- CORS --`,
      `CORS_ORIGINS=http://localhost:4200`,
      ``,
      `# -- Azure Functions --`,
      `FUNCTIONS_WORKER_RUNTIME=node`,
      `AzureWebJobsStorage=UseDevelopmentStorage=true`,
      ``,
    ].join('\n');
  }

  return [
    ...header,
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
  ].join('\n');
}
