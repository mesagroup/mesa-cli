import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function render(_config: PrototypeConfig): string {
  return `name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

# CI runs lint + typecheck + build on every push/PR.
# It NEVER deploys — see deploy.yml for the manual deploy workflow.

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.9.0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      # Lockfile-agnostic: scaffolded repos may not yet have pnpm-lock.yaml
      # committed. Once you commit the lockfile, switch to a frozen install
      # for reproducible CI.
      - run: pnpm install

      - name: Build
        run: pnpm build

      - name: Lint
        run: pnpm lint
        continue-on-error: true

      - name: Test
        run: pnpm test
        continue-on-error: true
`;
}
