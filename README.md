# MESA CLI

**MESA CLI** is an internal scaffolding tool for the MESA Group development team. It generates ready-to-code project structures for **MESAPPA plugins** — the modular extensions that power the MESAPPA platform.

The tool automates the tedious setup of boilerplate, security patterns, infrastructure configuration, and CI/CD pipelines, so that developers can focus on building business logic from minute one. Every generated project comes pre-configured with **Claude Code AI instructions** (CLAUDE.md), enabling AI-assisted development that follows MESA's coding standards and security constraints.

## Why MESA CLI

- **Consistent structure** across all plugin projects — same conventions, same security patterns, same deploy pipeline
- **Two deployment targets**: on-premise (SQL Server + Express + Aspire) and SaaS (Azure Functions + Azure SQL)
- **Environment assistant**: checks your machine for required tools and walks you through installing anything missing
- **AI-ready**: every project ships with CLAUDE.md files that encode MESA's development rules (V1-V11), so Claude Code understands your constraints out of the box
- **Cross-platform**: works on macOS and Windows

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
mesa init my-plugin -y                    # On-prem with frontend (defaults)
mesa init my-plugin --no-frontend -y      # Backend only
mesa init my-plugin --dry-run -y          # Preview without creating files
```

## Commands

### `mesa setup`

Verifies your development environment is ready. Checks and guides installation of:

| Tool | Required | Purpose |
|------|----------|---------|
| Git | Yes | Version control; also checks `user.name` and `user.email` configuration |
| Node.js | Yes | Runtime |
| Docker | Yes | Local SQL Server container (on-prem) |
| .NET SDK | Yes | Aspire orchestrator (on-prem) |
| GitHub CLI (`gh`) | No | Repo creation; checks authentication and `mesagroup` org access |
| Aspire CLI | Yes | Local dev orchestration (on-prem) |

If something is missing, MESA CLI shows the exact install command for your OS and waits for you to install it before re-checking.

> Runs automatically on the first `mesa init`.

### `mesa init [name]`

Scaffolds a MESAPPA plugin project. You choose between two project types:

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
