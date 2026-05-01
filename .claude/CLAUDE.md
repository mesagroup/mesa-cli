# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Build**: `pnpm build` (tsup, outputs to `dist/`)
- **Dev (watch)**: `pnpm dev`
- **Lint**: `pnpm lint` (xo with default config — no `.xo-config` file; prettier handles formatting)
- **Format**: `pnpm format`
- **Test all**: `pnpm test` (vitest)
- **Test single**: `pnpm test -- -t "test name"`
- **Test watch**: `pnpm test:watch`
- **Release build**: `pnpm release` (tsup with minification + node shebang)

Package manager is **pnpm 10.9.0** (enforced via `packageManager` field).

## Architecture

CLI scaffolding tool (`mesa`) that generates MESAPPA plugin projects. Published as the `mesa` npm command via `dist/cli.js`.

### Dual entry points

tsup produces two bundles (see `tsup.config.ts`):
- `dist/index.js` — Library entry (ESM + CJS, with `.d.ts`). Re-exports `ClientSDK` and types for programmatic use.
- `dist/cli.js` — CLI binary (ESM only, minified, with `#!/usr/bin/env node` banner).

### CLI commands

- **`mesa init [name]`** — Interactive wizard (`@inquirer/prompts`) that collects project config, then calls `scaffold()`. Supports `--dry-run`, `--yes` (skip prompts), `--no-frontend`. On first run, auto-triggers `setup` before scaffolding.
- **`mesa prototype [name]`** — Scaffolds a Vercel + Next.js + Hono + Neon Postgres monorepo. See `src/generators/prototype-scaffold.ts` and `src/templates/prototype/**`.
- **`mesa verify`** — Architecture audit: 5 checks (not-sqlite, REST, username+password auth, Vercel Blob storage, prod+preview environments). Implementations under `src/util/verify/checks/`.
- **`mesa setup`** — Checks required dev tools (Git, Node, Docker, .NET SDK, Aspire CLI, gh). With `--yes`, auto-installs everything possible. Docker is **optional**. Persists completion marker to `~/.mesa-cli/setup-done`.
- **`mesa login`** — Authenticates via `ClientSDK` against the MESA API (`{tenantId}.api.azurewebsites.net`).

Every command except `mesa verify --json` prints the MESA ASCII banner. Suppress with `MESA_NO_BANNER=1` or `--quiet`.

### Environment variables

- `MESA_BASE_URL` — Override base API URL for login
- `MESA_INSTANCE` — Default tenant ID when `--tenant-id` is not passed (falls back to `'default'`)
- `MESA_GITHUB_ORG` — GitHub org for repo creation during `init` (defaults to `mesagroup`)

### Source layout

- **`cli.ts`** — Entry point. Uses meow for arg parsing, routes to commands.
- **`commands/`** — `init.ts` (wizard + scaffold), `setup.ts` (tool checker loop + git identity + GitHub org access).
- **`generators/scaffold.ts`** — Core scaffolding engine. Builds a `FileEntry[]` manifest per project type, creates directories, writes all files, then runs `git init` + initial commit.
- **`templates/`** — Template renderers organized by target (backend, backend-saas, frontend, frontend-standalone, frontend-vite, nextjs, aspire, db, ci, scripts, scripts-saas, root).
- **`types/scaffold.ts`** — Core types: `ProjectType`, `ScaffoldConfig`, `DeployTarget`, `DatabaseType`, `FrontendType`, `MongoMode`.
- **`client/`** — `ClientSDK` with auth flow (password grant against Azure-hosted API).
- **`util/`** — Naming helpers (`toKebabCase`/`toPascalCase`/`validatePluginName`), tool checker, first-run detection, random name generator, URL resolver.

### Template pattern

Each template file exports `render(config: ScaffoldConfig): string`. The scaffold engine calls these and writes results to disk. To add a new template:
1. Create a `render` function in the appropriate `templates/` subdirectory
2. Import it in `generators/scaffold.ts`
3. Add a `files.push(...)` call in the correct manifest builder (`buildOnPremManifest`, `buildSaasManifest`, or `buildStandaloneManifest`)

### Scaffolding flow

`scaffold()` works in three phases:
1. **Manifest** — Calls `buildXxxManifest(config)` which returns a flat array of `{ relativePath, content }` entries. All file content is generated in memory before any I/O.
2. **Write** — Creates directories (sorted parent-first), then writes all files.
3. **Git init** — Runs `git init`, `git add .`, and creates initial commit. Optionally offers GitHub repo creation via `gh` CLI.

### Project types (init)

Three project types with different template combinations:
- **`onprem`** — Express backend + Angular 16 (Module Federation) frontend + SQL Server + .NET Aspire orchestrator
- **`saas`** — Azure Functions backend + Angular 16 frontend + Azure SQL + GitHub Actions CI
- **`standalone`** — Configurable stack: database (sqlserver/postgresql/mongodb), frontend (nextjs/angular/react-vite), deploy target (vercel/azure). When frontend is `nextjs`, scaffolds a single Next.js app with API routes (no separate backend). Otherwise scaffolds a monorepo with Express backend.

### Prototype scaffolder

`mesa prototype` is a separate generator (`src/generators/prototype-scaffold.ts`) that
produces a pnpm workspace with `apps/web` (Next.js), `apps/api` (Hono), and
`packages/db` (Drizzle + Neon). Always wires:
- Vercel Blob storage (`@vercel/blob`).
- Username + password auth (bcryptjs + jose JWT) with a `users` table.
- `.github/workflows/deploy.yml` triggered ONLY by `workflow_dispatch` with an
  `environment` input (preview/production). CI in `ci.yml` runs lint+build on push/PR.

### Cursor rules + Claude skills

`mesa init` and `mesa prototype` both inject:
- `.cursor/rules/{web-architecture,security,testing}.mdc`
- `.claude/skills/{architecture-audit,rest-api-design,secrets-management}.md`

`mesa prototype` additionally includes `.claude/skills/vercel-neon-deployment.md`.

Source: `src/templates/shared/{cursor-rules,claude-skills}.ts`. The same files are
also kept in this repo's `.cursor/rules/` and `.claude/skills/`.

### Database templates (`templates/db/`)

Each database module (sqlserver, postgresql, mongodb) exports `renderService(config)` instead of the standard `render()` — this is consumed by both the standalone Express backend and the Next.js full-stack path.
