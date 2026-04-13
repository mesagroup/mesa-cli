import type { ScaffoldConfig } from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
  const { projectType } = config;
  const lines = [
    `# ${config.pluginName}`,
    ``,
    `${config.description}`,
    ``,
    `## Prerequisites`,
    ``,
    `- [Node.js](https://nodejs.org/) 18+`,
  ];

  if (projectType === 'standalone') {
    lines.push(
      `- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for database container)`,
      `- Aspire CLI 13.2+: \`curl -sSL https://aspire.dev/install.sh | bash\``
    );
  } else if (projectType === 'saas') {
    lines.push(
      `- [Azure Functions Core Tools v4](https://learn.microsoft.com/azure/azure-functions/functions-run-local): \`npm i -g azure-functions-core-tools@4\``,
      `- [Azure CLI](https://aka.ms/installazurecli) (optional, for deployment)`,
      `- SQL Server instance (local or remote)`
    );
  } else {
    lines.push(
      `- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for SQL Server container)`,
      `- Aspire CLI 13.2+: \`curl -sSL https://aspire.dev/install.sh | bash\``
    );
  }

  lines.push(
    ``,
    `## Installation`,
    ``,
    `\`\`\`bash`,
    `npm run install:all`,
    `\`\`\``,
    ``,
    `## Development`,
    ``
  );

  if (projectType === 'standalone') {
    lines.push(
      `### With Aspire (recommended)`,
      ``,
      `Aspire orchestrates SQL Server, the backend, and the frontend in one command:`,
      ``,
      `\`\`\`bash`,
      `npm run dev`,
      `\`\`\``,
      ``,
      `This runs \`aspire run\`, which reads \`apphost.ts\` and starts all services.`,
      ``,
      `### Without Aspire (manual)`,
      ``,
      `1. Copy \`.env.example\` to \`.env\` and fill in your database credentials.`,
      `2. Start a SQL Server instance (Docker or local).`,
      `3. Start the backend:`,
      ``,
      `\`\`\`bash`,
      `cd backend`,
      `npm run dev`,
      `\`\`\``,
      ``
    );
    if (config.includeFrontend) {
      lines.push(
        `4. Start the frontend:`,
        ``,
        `\`\`\`bash`,
        `cd frontend`,
        `npm run dev`,
        `\`\`\``,
        ``,
        `The Next.js dev server proxies \`/api\` requests to the Express backend.`,
        ``
      );
    }
  } else if (projectType === 'saas') {
    lines.push(
      `1. Copy \`backend/local.settings.json.example\` to \`backend/local.settings.json\` and fill in credentials.`,
      `2. Start the backend:`,
      ``,
      `\`\`\`bash`,
      `npm run dev`,
      `\`\`\``,
      ``,
      `This runs \`func start\` in the backend directory.`,
      ``
    );
    if (config.includeFrontend) {
      lines.push(
        `3. Start the frontend (separate terminal):`,
        ``,
        `\`\`\`bash`,
        `cd frontend`,
        `npm start`,
        `\`\`\``,
        ``
      );
    }
  } else {
    lines.push(
      `### With Aspire (recommended)`,
      ``,
      `Aspire orchestrates SQL Server, the backend, and the frontend in one command:`,
      ``,
      `\`\`\`bash`,
      `npm run dev`,
      `\`\`\``,
      ``,
      `This runs \`aspire run\`, which reads \`apphost.ts\` and starts all services.`,
      ``,
      `### Without Aspire (manual)`,
      ``,
      `1. Copy \`.env.example\` to \`.env\` and fill in your database credentials.`,
      `2. Start a SQL Server instance (Docker or local).`,
      `3. Start the backend:`,
      ``,
      `\`\`\`bash`,
      `cd backend`,
      `npm run dev`,
      `\`\`\``,
      ``
    );
    if (config.includeFrontend) {
      lines.push(
        `4. Start the frontend:`,
        ``,
        `\`\`\`bash`,
        `cd frontend`,
        `npm start`,
        `\`\`\``,
        ``
      );
    }
  }

  lines.push(
    `## Build`,
    ``,
    `\`\`\`bash`,
    `npm run build`,
    `\`\`\``,
    ``,
    `This compiles the backend with \`tsc\`${config.includeFrontend ? ' and builds the frontend with `ng build --configuration production`' : ''}.`,
    ``,
    `## Deployment`,
    ``
  );

  if (projectType === 'standalone') {
    lines.push(
      `Refer to the deployment rules:`,
      ``,
      `- Use \`npm ci\` (not \`npm install\`) for reproducible builds (V7).`,
      `- All environment variables must be injected by the deployment platform.`,
      `- No hardcoded paths; use relative paths or env vars (V8).`,
      `- Ensure CORS origins are whitelisted for the production domain (V4).`,
      `- Configure TLS termination at the reverse proxy.`,
      `- See \`scripts/deploy.ps1\` for a deployment script template.`
    );
  } else if (projectType === 'saas') {
    lines.push(
      `CI/CD is configured via GitHub Actions (\`.github/workflows/ci.yml\`):`,
      ``,
      `- Every PR triggers build + test + lint.`,
      `- Push to \`main\` triggers deployment to Azure Functions.`,
      `- Secrets (\`AZURE_CREDENTIALS\`, \`AZURE_FUNCTION_APP_NAME\`) are stored in GitHub Secrets.`,
      `- See \`scripts/deploy.ps1\` for manual deployment.`,
      ``,
      `**Post-deploy:** verify the health endpoint returns 200 OK.`
    );
  } else {
    lines.push(
      `Refer to the MESAPPA deployment rules:`,
      ``,
      `- Use \`npm ci\` (not \`npm install\`) for reproducible builds (V7).`,
      `- All environment variables must be injected by the deployment platform.`,
      `- No hardcoded paths; use relative paths or env vars (V8).`,
      `- Ensure CORS origins are whitelisted for the production domain (V4).`,
      `- Configure TLS termination at the reverse proxy.`,
      `- See \`scripts/deploy.ps1\` for a deployment script template.`
    );
  }

  lines.push(
    ``,
    `## Environment Variables`,
    ``,
    `See [docs/env-vars.md](./env-vars.md) for full documentation.`,
    ``
  );

  return lines.join('\n');
}
