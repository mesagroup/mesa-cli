import type { ScaffoldConfig } from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
  const packages: Record<string, string> = {
    'Aspire.Hosting.JavaScript': '13.2.2',
  };

  const db = config.database ?? 'sqlserver';
  if (db === 'postgresql') {
    packages['Aspire.Hosting.PostgreSQL'] = '13.2.2';
  } else if (db === 'mongodb') {
    packages['Aspire.Hosting.MongoDB'] = '13.2.2';
  } else {
    packages['Aspire.Hosting.SqlServer'] = '13.2.2';
  }

  return (
    JSON.stringify(
      {
        appHost: {
          path: 'apphost.ts',
          language: 'typescript/nodejs',
        },
        sdk: {
          version: '13.2.2',
        },
        profiles: {
          https: {
            applicationUrl: 'https://localhost:17187;http://localhost:15088',
            environmentVariables: {
              ASPIRE_DASHBOARD_OTLP_ENDPOINT_URL: 'https://localhost:21150',
              ASPIRE_RESOURCE_SERVICE_ENDPOINT_URL: 'https://localhost:22183',
            },
          },
          http: {
            applicationUrl: 'http://localhost:15088',
            environmentVariables: {
              ASPIRE_DASHBOARD_OTLP_ENDPOINT_URL: 'http://localhost:19052',
              ASPIRE_RESOURCE_SERVICE_ENDPOINT_URL: 'http://localhost:20158',
              ASPIRE_ALLOW_UNSECURED_TRANSPORT: 'true',
            },
          },
        },
        packages,
      },
      null,
      2
    ) + '\n'
  );
}
