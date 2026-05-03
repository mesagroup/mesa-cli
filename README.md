# MESA CLI

**MESA CLI** is an internal scaffolding tool for the MESA Group development team. It generates ready-to-code project structures for **MESAPPA plugins** — the modular extensions that power the MESAPPA platform.

The tool automates the tedious setup of boilerplate, security patterns, infrastructure configuration, and CI/CD pipelines, so that developers can focus on building business logic from minute one. Every generated project comes pre-configured with **Claude Code AI instructions** (CLAUDE.md), enabling AI-assisted development that follows MESA's coding standards and security constraints.

## Why MESA CLI

- **Consistent structure** across all plugin projects — same conventions, same security patterns, same deploy pipeline
- **Three project types**: on-premise plugin, SaaS plugin, and standalone PoC with configurable stack
- **Environment assistant**: checks your machine for required tools and walks you through installing anything missing
- **AI-ready**: every project ships with CLAUDE.md files that encode MESA's development rules (V1-V11), so Claude Code understands your constraints out of the box
- **Cross-platform**: works on macOS, Windows, and Linux

## Install

```bash
npm install -g @mesagroup/mesa-cli
```

## Quick Start

```bash
mesa init
```

That's it. The interactive wizard handles the rest: project type, name, description, frontend, and optional GitHub repo creation.

### Non-interactive mode

```bash
mesa init my-plugin -y                          # On-prem with frontend (defaults)
mesa init my-plugin --type standalone -y        # Standalone PoC (Next.js + SQL Server + Vercel)
mesa init my-plugin --no-frontend -y            # Backend only
mesa init my-plugin --dry-run -y                # Preview without creating files
```

## Commands

### `mesa setup`

Verifies your development environment is ready. Checks and **auto-installs** missing
tools using the platform-appropriate installer (winget on Windows, brew on macOS,
apt/curl on Linux). Pass `--yes` to skip confirmation prompts and install everything
non-interactively.

| Tool | Required | Purpose |
|------|----------|---------|
| Git | Yes | Version control; also checks `user.name` and `user.email` configuration |
| Node.js | Yes | Runtime |
| Aspire CLI 13.2+ | Yes | Local dev orchestration (TypeScript AppHost) |
| Docker | **No** (optional) | Local database containers — only needed for projects scaffolded with local DB |
| .NET SDK | No | Only needed for C# AppHost projects |
| GitHub CLI (`gh`) | No | Repo creation; checks authentication and `mesagroup` org access |

If a tool's auto-install fails (or no installer is available for your platform), MESA
CLI prints the exact manual install command and waits for you to retry.

> Runs automatically on the first `mesa init`.

### `mesa prototype [name]`

Scaffolds a Vercel + Next.js + Hono + **Neon Postgres** monorepo with username/password
authentication, Vercel Blob storage, Drizzle ORM, and **manual-only** GitHub Actions
deploys (no auto-deploy on push or PR).

```bash
mesa prototype                                # interactive wizard
mesa prototype my-app -y                      # non-interactive
mesa prototype my-app -y --no-github          # skip 'gh repo create'
mesa prototype my-app --github-org my-org     # override default GitHub org
```

If `gh` is on PATH and you're running interactively, the wizard offers to
create a private GitHub repo via `gh repo create <org>/<name> --source . --push`.
Override the default org with `--github-org` or the `MESA_GITHUB_ORG` env var.
Failures are non-fatal — the local scaffold is preserved either way.

| Layer    | Technology                                  |
| -------- | ------------------------------------------- |
| Frontend | Next.js 15 (App Router) + Tailwind v4       |
| Backend  | Hono mounted at `app/api/[...route]/route.ts` |
| Database | Neon Postgres (`@neondatabase/serverless`)  |
| ORM      | Drizzle ORM                                 |
| Storage  | Vercel Blob (`@vercel/blob`)                |
| Auth     | Username + password (bcryptjs) + JWT (jose) |
| Deploy   | Vercel + GitHub Actions (`workflow_dispatch` only) |

Generated layout:

```
my-app/
  apps/
    web/                    # Next.js (mounts Hono via API route)
    api/                    # Hono app + routes (auth, health, me, uploads)
  packages/
    db/                     # Drizzle schema + Neon client
  vercel.json
  .github/workflows/
    ci.yml                  # build/lint/test on push/PR (no deploy)
    deploy.yml              # manual-only via `gh workflow run deploy.yml`
  .cursor/rules/            # web-architecture, security, testing
  .claude/skills/           # architecture-audit, rest-api-design,
                            # secrets-management, vercel-neon-deployment
```

After scaffolding:

```bash
cd my-app
pnpm install
cp .env.example .env.local             # NEON_DATABASE_URL + JWT_SECRET + BLOB_READ_WRITE_TOKEN
pnpm db:push                            # apply Drizzle schema to Neon
pnpm dev                                # http://localhost:3000

# Deploy (manual)
gh workflow run deploy.yml -f environment=preview
gh workflow run deploy.yml -f environment=production
```

### `mesa verify`

Audits a generated project against MESA architecture best practices. Five checks:

| Check                              | Passes when…                                                          |
| ---------------------------------- | --------------------------------------------------------------------- |
| Database is not SQLite             | No `sqlite3`/`better-sqlite3`/`@libsql/client` deps or `sqlite://` URLs |
| Endpoints are REST                 | Hono/Express `<router>.<method>('/...')` or Next.js `route.ts` exports |
| Authentication uses username + password | Hashing dep (bcrypt/argon2) AND code references password + username/email |
| Storage uses Vercel Blob           | `@vercel/blob` in deps OR `BLOB_READ_WRITE_TOKEN` referenced           |
| Production + preview environments  | Both `environment: production` and `environment: preview` in workflows |

```bash
mesa verify                          # pretty table, exit 1 if any fails
mesa verify --explain                # show evidence per check
mesa verify --json                   # machine-readable (banner suppressed)
mesa verify --cwd path/to/project    # audit a specific directory
```

### `mesa init [name]`

Scaffolds a MESAPPA plugin or standalone PoC project. You choose between three project types:

#### Stack comparison

| Type | Backend | Frontend | Database | Orchestrator | Deploy | CI/CD |
|------|---------|----------|----------|-------------|--------|-------|
| **onprem** | Express | Angular 16 (MF) | SQL Server | Aspire | — | — |
| **saas** | Azure Functions v4 | Angular 16 (MF) | Azure SQL | — | Azure | GitHub Actions |
| **standalone** (defaults) | Next.js API routes | Next.js | SQL Server | Aspire | Vercel | GitHub Actions |
| **standalone** + angular | Express | Angular 16 | SQL Server / PostgreSQL / MongoDB | Aspire* | Vercel / Azure | GitHub Actions |
| **standalone** + react-vite | Express | React + Vite | SQL Server / PostgreSQL / MongoDB | Aspire* | Vercel / Azure | GitHub Actions |

\* Aspire is skipped when MongoDB Atlas is selected. All backends use TypeScript. Auth is JWT (jose) for Express-based, Azure AD middleware for SaaS.

#### Plugin (On Premise)

For MESAPPA instances deployed on customer infrastructure with SQL Server.

- **Backend**: TypeScript + Express, compiled with `tsc`
- **Frontend** (optional): Angular 16 + Module Federation
- **Database**: SQL Server (Windows Auth or SQL Auth)
- **Local dev**: .NET Aspire orchestrates SQL Server container + backend + frontend
- **Auth**: JWT from MESAPPA host, verified with `jose`

#### Plugin (SaaS)

For cloud-hosted MESAPPA instances on Azure.

- **Backend**: Azure Functions v4 (TypeScript, HTTP triggers)
- **Frontend** (optional): Angular 16 + Module Federation
- **Database**: Azure SQL
- **Local dev**: Azure Functions Core Tools + `ng serve`
- **CI/CD**: GitHub Actions workflow (build, test, deploy)
- **Auth**: JWT via Azure Functions middleware

#### Standalone App (PoC)

For proof-of-concept applications with a configurable stack.

- **Backend**: Next.js API routes (full-stack) or Express (monorepo)
- **Frontend**: Next.js, Angular 16, or React + Vite
- **Database**: SQL Server, PostgreSQL, or MongoDB (local Docker or Atlas)
- **Local dev**: Aspire orchestrates database + app services
- **Deploy**: Vercel or Azure (via Aspire + azd)
- **CI/CD**: GitHub Actions

Defaults to Next.js full-stack + SQL Server + Vercel when using `--yes` or accepting defaults in the wizard.

### Generated structure (on-prem)

```
my-plugin/
├── backend/
│   ├── src/
│   │   ├── config/env.ts          # Zod-validated env config
│   │   ├── middleware/authJwt.ts   # JWT verification
│   │   ├── routes/                # Express routing + validation
│   │   ├── services/db.ts         # MSSQL connection pool
│   │   └── server.ts              # Express + Helmet + CORS whitelist
│   ├── .env.example
│   └── package.json
├── frontend/                      # (optional)
│   ├── projects/<name>/           # Plugin library (Module Federation)
│   ├── src/app/                   # Dev shell
│   ├── webpack.config.js
│   └── package.json
├── aspire/apphost.ts              # Orchestrator
├── scripts/                       # start-local + deploy (ps1/sh)
├── docs/                          # README + env variable reference
├── .claude/CLAUDE.md              # AI rules for Claude Code
├── CLAUDE.md
├── .env.example
└── .gitignore
```

### Generated structure (SaaS)

```
my-plugin/
├── backend/
│   ├── src/
│   │   ├── functions/             # Azure Function triggers
│   │   ├── config/env.ts
│   │   ├── middleware/             # JWT auth middleware
│   │   └── services/db.ts         # Azure SQL connection
│   ├── host.json
│   ├── local.settings.json.example
│   └── package.json
├── frontend/                      # (optional, same as on-prem)
├── .github/workflows/ci.yml      # GitHub Actions CI/CD
├── scripts/
├── docs/
├── .claude/CLAUDE.md
└── .gitignore
```

### `mesa login`

Authenticate with a MESA instance.

```bash
mesa login --tenant-id=mesappa
```

## Init options

| Flag | Description |
|------|-------------|
| `--type <type>` | Project type: `onprem`, `saas`, or `standalone` (default: `onprem`) |
| `--no-frontend` | Skip Angular frontend generation |
| `--author <name>` | Author name (default: `git config user.name`) |
| `--description <text>` | Plugin description |
| `--dry-run` | Preview generated files without writing |
| `-y, --yes` | Skip prompts, use auto-generated defaults |

## After scaffolding

### On-prem

```bash
cd my-plugin
npm run install:all
aspire run             # SQL Server + backend + frontend + dashboard
```

### SaaS

```bash
cd my-plugin
npm run install:all
npm run dev            # Azure Functions + Angular dev server
```

## Security rules enforced (V1-V11)

Every generated project embeds these constraints in CLAUDE.md, so both humans and AI follow them:

- **V1**: No secrets in tracked files
- **V2**: JWT required on all endpoints (except `/api/health`)
- **V3**: All SQL uses parameterized queries
- **V4**: No stack traces or internal messages in HTTP responses
- **V5**: No file exceeds ~400 lines without splitting
- **V6**: Business logic in `services/`, routes only validate + orchestrate
- **V8**: `.env` in `.gitignore`, only `.env.example` committed
- **V10**: CORS with explicit origin whitelist

## Contributing

```bash
git clone https://github.com/mesagroup/mesa-cli.git
cd mesa-cli
pnpm install
pnpm build          # Build CLI
pnpm dev            # Watch mode
pnpm lint           # xo + prettier
pnpm test           # vitest
```

### Tech stack

- **TypeScript** + **tsup** (bundler)
- **meow** (CLI framework) + **@inquirer/prompts** (interactive wizard)
- **chalk** (terminal styling)
- **pnpm** 10.9.0

## License

ISC
