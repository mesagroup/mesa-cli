import type { ScaffoldConfig } from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
  if (config.deployTarget === 'azure') {
    return renderAzurePipeline(config);
  }

  return renderVercelPipeline(config);
}

function renderVercelPipeline(config: ScaffoldConfig): string {
  const lines = [
    `name: CI`,
    ``,
    `on:`,
    `  push:`,
    `    branches: [main]`,
    `  pull_request:`,
    `    branches: [main]`,
    ``,
    `env:`,
    `  VERCEL_ORG_ID: \${{ secrets.VERCEL_ORG_ID }}`,
    `  VERCEL_PROJECT_ID: \${{ secrets.VERCEL_PROJECT_ID }}`,
    ``,
    `jobs:`,
    `  build-and-test:`,
    `    runs-on: ubuntu-latest`,
    `    steps:`,
    `      - uses: actions/checkout@v4`,
    ``,
    `      - uses: actions/setup-node@v4`,
    `        with:`,
    `          node-version: 20`,
    `          cache: npm`,
    `          cache-dependency-path: backend/package-lock.json`,
    ``,
    `      - name: Install backend dependencies`,
    `        run: cd backend && npm ci`,
    ``,
    `      - name: Build backend`,
    `        run: cd backend && npm run build`,
    ``,
  ];

  if (config.includeFrontend) {
    lines.push(
      `      - name: Install frontend dependencies`,
      `        run: cd frontend && npm ci`,
      ``,
      `      - name: Build frontend`,
      `        run: cd frontend && npm run build`,
      ``
    );
  }

  lines.push(
    `  deploy-preview:`,
    `    if: github.event_name == 'pull_request'`,
    `    needs: build-and-test`,
    `    runs-on: ubuntu-latest`,
    `    steps:`,
    `      - uses: actions/checkout@v4`,
    ``,
    `      - uses: actions/setup-node@v4`,
    `        with:`,
    `          node-version: 20`,
    ``,
    `      - name: Install Vercel CLI`,
    `        run: npm i -g vercel@latest`,
    ``,
    `      - name: Pull Vercel environment`,
    `        run: vercel pull --yes --environment=preview --token=\${{ secrets.VERCEL_TOKEN }}`,
    ``,
    `      - name: Build for Vercel`,
    `        run: vercel build --token=\${{ secrets.VERCEL_TOKEN }}`,
    ``,
    `      - name: Deploy preview`,
    `        run: vercel deploy --prebuilt --token=\${{ secrets.VERCEL_TOKEN }}`,
    ``,
    `  deploy-production:`,
    `    if: github.ref == 'refs/heads/main' && github.event_name == 'push'`,
    `    needs: build-and-test`,
    `    runs-on: ubuntu-latest`,
    `    steps:`,
    `      - uses: actions/checkout@v4`,
    ``,
    `      - uses: actions/setup-node@v4`,
    `        with:`,
    `          node-version: 20`,
    ``,
    `      - name: Install Vercel CLI`,
    `        run: npm i -g vercel@latest`,
    ``,
    `      - name: Pull Vercel environment`,
    `        run: vercel pull --yes --environment=production --token=\${{ secrets.VERCEL_TOKEN }}`,
    ``,
    `      - name: Build for Vercel`,
    `        run: vercel build --prod --token=\${{ secrets.VERCEL_TOKEN }}`,
    ``,
    `      - name: Deploy to production`,
    `        run: vercel deploy --prebuilt --prod --token=\${{ secrets.VERCEL_TOKEN }}`,
    ``
  );

  return lines.join('\n');
}

function renderAzurePipeline(config: ScaffoldConfig): string {
  const lines = [
    `name: CI/CD`,
    ``,
    `on:`,
    `  push:`,
    `    branches: [main]`,
    `  pull_request:`,
    `    branches: [main]`,
    ``,
    `jobs:`,
    `  build-and-test:`,
    `    runs-on: ubuntu-latest`,
    `    steps:`,
    `      - uses: actions/checkout@v4`,
    ``,
    `      - uses: actions/setup-node@v4`,
    `        with:`,
    `          node-version: 20`,
    `          cache: npm`,
    `          cache-dependency-path: backend/package-lock.json`,
    ``,
    `      - name: Install backend dependencies`,
    `        run: cd backend && npm ci`,
    ``,
    `      - name: Build backend`,
    `        run: cd backend && npm run build`,
    ``,
  ];

  if (config.includeFrontend) {
    lines.push(
      `      - name: Install frontend dependencies`,
      `        run: cd frontend && npm ci`,
      ``,
      `      - name: Build frontend`,
      `        run: cd frontend && npm run build`,
      ``
    );
  }

  lines.push(
    `  deploy:`,
    `    if: github.ref == 'refs/heads/main' && github.event_name == 'push'`,
    `    needs: build-and-test`,
    `    runs-on: ubuntu-latest`,
    `    env:`,
    `      AZURE_CLIENT_ID: \${{ secrets.AZURE_CLIENT_ID }}`,
    `      AZURE_TENANT_ID: \${{ secrets.AZURE_TENANT_ID }}`,
    `      AZURE_SUBSCRIPTION_ID: \${{ secrets.AZURE_SUBSCRIPTION_ID }}`,
    `    steps:`,
    `      - uses: actions/checkout@v4`,
    ``,
    `      - name: Install azd`,
    `        uses: Azure/setup-azd@v2`,
    ``,
    `      - name: Log in to Azure`,
    `        run: azd auth login --client-id \$AZURE_CLIENT_ID --federated-credential-provider github --tenant-id \$AZURE_TENANT_ID`,
    ``,
    `      - name: Deploy with Aspire (azd)`,
    `        run: azd up --no-prompt`,
    `        env:`,
    `          AZURE_ENV_NAME: \${{ vars.AZURE_ENV_NAME }}`,
    ``
  );

  return lines.join('\n');
}
