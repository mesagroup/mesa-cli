import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function render(_config: PrototypeConfig): string {
  return `name: Deploy

# Manual-only deploy. No deploy on push or PR — by design.
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'preview'
        type: choice
        options:
          - preview
          - production

jobs:
  deploy-preview:
    if: github.event.inputs.environment == 'preview'
    runs-on: ubuntu-latest
    environment: preview
    env:
      VERCEL_ORG_ID: \${{ secrets.VERCEL_ORG_ID }}
      VERCEL_PROJECT_ID: \${{ secrets.VERCEL_PROJECT_ID }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.9.0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      # Lockfile-agnostic: see ci.yml note. Switch to a frozen install once
      # pnpm-lock.yaml is committed.
      - run: pnpm install

      - name: Install Vercel CLI
        run: npm i -g vercel@latest

      - name: Vercel pull (preview)
        run: vercel pull --yes --environment=preview --token=\${{ secrets.VERCEL_TOKEN }}

      - name: Vercel build (preview)
        run: vercel build --token=\${{ secrets.VERCEL_TOKEN }}

      - name: Vercel deploy (preview)
        run: vercel deploy --prebuilt --token=\${{ secrets.VERCEL_TOKEN }}

  deploy-production:
    if: github.event.inputs.environment == 'production'
    runs-on: ubuntu-latest
    environment: production
    env:
      VERCEL_ORG_ID: \${{ secrets.VERCEL_ORG_ID }}
      VERCEL_PROJECT_ID: \${{ secrets.VERCEL_PROJECT_ID }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.9.0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      # Lockfile-agnostic: see ci.yml note. Switch to a frozen install once
      # pnpm-lock.yaml is committed.
      - run: pnpm install

      - name: Install Vercel CLI
        run: npm i -g vercel@latest

      - name: Vercel pull (production)
        run: vercel pull --yes --environment=production --token=\${{ secrets.VERCEL_TOKEN }}

      - name: Vercel build (production)
        run: vercel build --prod --token=\${{ secrets.VERCEL_TOKEN }}

      - name: Vercel deploy (production)
        run: vercel deploy --prebuilt --prod --token=\${{ secrets.VERCEL_TOKEN }}
`;
}
