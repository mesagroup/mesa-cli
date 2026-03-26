# MESA CLI

Command-line tool for scaffolding **MESAPPA on-prem plugin** projects — complete with TypeScript + Express backend, optional Angular 16 frontend with Module Federation, and .NET Aspire orchestration.

Works on **macOS** and **Windows**.

## Install

```bash
pnpm install -g .
```

Or link locally for development:

```bash
pnpm build && pnpm link --global
```

## Quick Start

```bash
# Interactive — walks you through name, description, frontend, GitHub repo
mesa init

# Non-interactive with defaults
mesa init my-plugin -y

# Backend-only (no Angular frontend)
mesa init my-plugin --no-frontend -y

# Preview without writing files
mesa init my-plugin --dry-run -y
```

## Commands

### `mesa setup`

Checks that all required development tools are installed and guides you through fixing anything missing.

**Checks performed:**
- **Node.js** (required)
- **pnpm** (required)
- **Git** (required) — also verifies `user.name` and `user.email` are configured
- **GitHub CLI** (`gh`) — verifies authentication and org access to `mesagroup`
- **Docker Desktop** (required for local SQL Server)
- **.NET Aspire CLI** (optional, for orchestration)

If a tool is missing, MESA CLI shows the exact install command for your platform and waits for you to install it before re-checking.

> `mesa setup` runs automatically on first use of `mesa init`.

### `mesa init [name]`

Scaffolds a complete MESAPPA plugin project:

```
my-plugin/
├── backend/
│   ├── src/
│   │   ├── config/env.ts          # Zod-validated env config
│   │   ├── middleware/authJwt.ts   # JWT verification (jose)
│   │   ├── routes/health.ts       # Health check with DB probe
│   │   ├── routes/index.ts        # API router
│   │   ├── services/db.ts         # MSSQL connection pool (Aspire-aware)
│   │   └── server.ts              # Express + Helmet + CORS
│   ├── .env.example
│   ├── nodemon.json
│   ├── package.json
│   └── tsconfig.json
├── frontend/                      # (if --no-frontend is not set)
│   ├── projects/<name>/src/
│   │   ├── lib/<name>.module.ts
│   │   ├── lib/<name>.component.ts
│   │   ├── lib/<name>.service.ts
│   │   ├── lib/models.ts          # MESAPPA V9 interfaces
│   │   └── public-api.ts
│   ├── src/app/                   # Dev shell app
│   ├── angular.json
│   ├── webpack.config.js          # Module Federation
│   ├── proxy.conf.js
│   ├── package.json
│   └── tsconfig.json
├── aspire/
│   └── apphost.ts                 # .NET Aspire orchestrator
├── scripts/
│   ├── start-local.ps1
│   ├── start-local.sh
│   └── deploy.ps1
├── docs/
│   ├── README.md
│   └── env-vars.md
├── .claude/CLAUDE.md              # AI coding rules for Claude Code
├── CLAUDE.md                      # Project-level AI instructions
├── .env.example
├── .gitignore
└── package.json                   # Root workspace scripts
```

**Options:**

| Flag | Description |
|------|-------------|
| `--no-frontend` | Skip Angular frontend generation |
| `--author <name>` | Author name (default: `git config user.name`) |
| `--description <text>` | Plugin description |
| `--dry-run` | Preview generated files without writing |
| `-y, --yes` | Skip prompts, use auto-generated defaults |

After scaffolding, the CLI optionally creates a GitHub repo on `mesagroup` and pushes the initial commit.

### `mesa login`

Authenticate with a MESA instance.

| Flag | Description |
|------|-------------|
| `--tenant-id <id>` | Tenant ID (default: `MESA_INSTANCE` env var or `default`) |

## Generated Project — Getting Started

```bash
cd my-plugin

# Install all dependencies
npm run install:all

# Start with Aspire (recommended)
aspire run

# Or start manually
cd backend && npm run dev
cd frontend && npm start     # if frontend is present
```

### Prerequisites for Generated Projects

| Tool | Purpose |
|------|---------|
| Docker Desktop | SQL Server container |
| .NET SDK 10+ | Aspire orchestrator |
| Aspire CLI | `dotnet tool install -g aspire.cli` |
| Node.js 20+ | Runtime |
| pnpm | Package manager |

## Development

```bash
pnpm install
pnpm build          # Build CLI
pnpm dev            # Watch mode
pnpm lint           # xo + prettier
pnpm test           # vitest
```

## Tech Stack

- **TypeScript** + **tsup** (bundler)
- **meow** (CLI framework)
- **@inquirer/prompts** (interactive prompts)
- **chalk** (terminal styling)
- **zod** (env validation in generated projects)

## License

ISC
