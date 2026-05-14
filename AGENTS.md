# AGENTS.md

## Cursor Cloud specific instructions

This is a single-package TypeScript CLI tool (`@mesagroup/mesa-cli`). No backend services, databases, or Docker containers are needed for development.

### Commands

See `package.json` scripts and `.claude/CLAUDE.md` for the full list. Key commands:

- **Build**: `pnpm build`
- **Dev (watch)**: `pnpm dev`
- **Lint**: `pnpm lint` (xo — has ~1996 pre-existing lint errors as of v1.2.1)
- **Test**: `pnpm test -- --run` (non-watch single run; 1 pre-existing timeout on the MongoDB Atlas scaffold test)
- **Format**: `pnpm format`

### Caveats

- The linter (`xo`) reports many errors related to missing `.js` file extensions in imports and `prettier/prettier` formatting. These are pre-existing in the codebase and not regressions.
- The CLI's `mesa setup` command checks for external tools (Docker, .NET SDK, Aspire CLI, GitHub CLI) — these are **not** needed for developing the CLI itself, only for projects the CLI generates. Docker is now optional.
- To exercise the CLI after building: `node dist/cli.js init <name> --dry-run -y` (dry-run mode previews scaffolding without writing files).
- New commands:
  - `mesa prototype <name> -y` — scaffolds a Vercel + Next.js + Hono + Neon + Drizzle + JWT auth monorepo. Use `--no-github` to skip the optional `gh repo create` flow, `--github-org=<org>` to override the default org (also `MESA_GITHUB_ORG`).
  - `mesa verify --cwd <dir>` — architecture audit (5 checks: not-sqlite, REST endpoints, username+password auth, Vercel Blob storage, prod+preview environments). Add `--json` for machine-readable output (auto-suppresses the banner) and `--explain` to print evidence per check.
  - `mesa setup -y` — non-interactive setup (auto-installs missing tools without prompting).
- Banner / quiet flags: `MESA_NO_BANNER=1`, `MESA_QUIET=1`, or `--quiet` to suppress the ASCII banner. The banner is auto-suppressed for `verify --json` so JSON stays parseable.
- Auto-install safety: shell-based install fallbacks (`curl … | sudo bash` for Docker, .NET, Aspire on Linux) are opt-in for non-interactive runs. Set `MESA_AUTO_INSTALL=1` in CI to allow them, or `MESA_AUTO_INSTALL=0` to force-disable everywhere.
- Linux is now a first-class platform alongside macOS and Windows (NodeSource for Node, official apt source for `gh`, get.docker.com for Docker, dotnet-install.sh for .NET, aspire.dev/install.sh for Aspire).
- `vitest.config.ts` sets `testTimeout: 30s` because scaffold tests do real I/O and `git init`.
