import type { ScaffoldConfig } from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
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
    `          node-version: "20"`,
    ``,
    `      - name: Install backend dependencies`,
    `        run: npm ci`,
    `        working-directory: backend`,
    ``,
    `      - name: Build backend`,
    `        run: npm run build`,
    `        working-directory: backend`,
    ``,
    `      - name: Test backend`,
    `        run: npm test`,
    `        working-directory: backend`,
  ];

  if (config.includeFrontend) {
    lines.push(
      ``,
      `      - name: Install frontend dependencies`,
      `        run: npm ci`,
      `        working-directory: frontend`,
      ``,
      `      - name: Build frontend`,
      `        run: npm run build`,
      `        working-directory: frontend`
    );
  }

  lines.push(
    ``,
    `  deploy:`,
    `    if: github.event_name == 'push' && github.ref == 'refs/heads/main'`,
    `    needs: build-and-test`,
    `    runs-on: ubuntu-latest`,
    `    steps:`,
    `      - uses: actions/checkout@v4`,
    ``,
    `      - uses: actions/setup-node@v4`,
    `        with:`,
    `          node-version: "20"`,
    ``,
    `      - name: Install backend dependencies`,
    `        run: npm ci`,
    `        working-directory: backend`,
    ``,
    `      - name: Build backend`,
    `        run: npm run build`,
    `        working-directory: backend`,
    ``,
    `      - name: Azure Login`,
    `        uses: azure/login@v2`,
    `        with:`,
    `          creds: \${{ secrets.AZURE_CREDENTIALS }}`,
    ``,
    `      - name: Deploy to Azure Functions`,
    `        run: |`,
    `          npm install -g azure-functions-core-tools@4 --unsafe-perm true`,
    `          func azure functionapp publish \${{ secrets.AZURE_FUNCTION_APP_NAME }}`,
    `        working-directory: backend`,
    ``
  );

  return lines.join('\n');
}
