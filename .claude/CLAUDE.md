# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Build**: `pnpm build` (tsup, outputs to `dist/`)
- **Dev (watch)**: `pnpm dev`
- **Lint**: `pnpm lint` (xo + prettier)
- **Format**: `pnpm format`
- **Test all**: `pnpm test` (vitest)
- **Test single**: `pnpm test -- -t "test name"`
- **Test watch**: `pnpm test:watch`
- **Release build**: `pnpm release` (tsup with minification + node shebang)

Package manager is **pnpm 10.9.0** (enforced via `packageManager` field).

## Architecture

This is a CLI scaffolding tool (`mesa`) that generates MESAPPA plugin projects. The binary entry point is `dist/cli.js`, published as the `mesa` command.

### Source layout (`src/`)

- **`cli.ts`** — Entry point. Uses meow for CLI parsing, routes to commands (`init`, `setup`, `login`).
- **`index.ts`** — Library entry re-exporting `client/` and `types/` for programmatic use.
- **`commands/`** — Command handlers:
  - `init.ts` — Interactive wizard (via `@inquirer/prompts`) collecting project config, then calls `scaffold()`.
  - `setup.ts` — Environment checker (Docker, .NET, Node, gh CLI, etc.).
- **`generators/scaffold.ts`** — Core scaffolding engine. Takes a `ScaffoldConfig`, writes the full project tree to disk. Imports all template renderers and conditionally emits files based on project type.
- **`templates/`** — Template renderers organized by target:
  - `backend/` — On-prem Express templates
  - `backend-saas/` — Azure Functions templates
  - `frontend/` — Angular 16 Module Federation templates
  - `frontend-standalone/` — Next.js templates
  - `frontend-vite/` — React + Vite templates
  - `nextjs/` — Next.js full-stack app templates (API routes, db, auth)
  - `aspire/` — .NET Aspire orchestrator config
  - `db/` — Database-specific templates (sqlserver, postgresql, mongodb)
  - `ci/` — GitHub Actions workflows
  - `scripts/`, `scripts-saas/` — Platform start/deploy scripts
  - `root/` — Shared root files (package.json, .gitignore, CLAUDE.md, README, env docs)
- **`types/scaffold.ts`** — Core types: `ProjectType` (`onprem`|`saas`|`standalone`), `ScaffoldConfig`, `DeployTarget`, `DatabaseType`, `FrontendType`, `MongoMode`.
- **`client/`** — MESA API client SDK (`ClientSDK`) with auth/login flow.
- **`util/`** — Helpers: naming conventions, tool checker, first-run detection, name generator, URL resolver.

### Template pattern

Each template file exports a `render(config: ScaffoldConfig): string` function that returns the file content as a string. The scaffold engine calls these and writes the results to the output directory. When adding a new template:
1. Create a `render` function in the appropriate `templates/` subdirectory
2. Import it in `generators/scaffold.ts`
3. Add the `writeFile` call in the correct project-type branch

### Build outputs

tsup produces two bundles (configured in `tsup.config.ts`):
- `dist/index.js` — Library (ESM + CJS, with `.d.ts`)
- `dist/cli.js` — CLI binary (ESM only, minified, with `#!/usr/bin/env node` banner)

### Project types

The CLI scaffolds three project types with different template combinations:
- **`onprem`** — Express backend + Angular frontend + SQL Server + .NET Aspire
- **`saas`** — Azure Functions backend + Angular frontend + Azure SQL + GitHub Actions CI
- **`standalone`** — Configurable stack: database (sqlserver/postgresql/mongodb), frontend (nextjs/angular/react-vite), deploy target (vercel/azure)
