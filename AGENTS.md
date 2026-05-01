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
- New commands: `mesa prototype <name> -y` (Vercel + Next.js + Hono + Neon monorepo) and `mesa verify --cwd <dir>` (architecture audit). Pass `MESA_NO_BANNER=1` to suppress the ASCII banner in CI/scripts.
- `vitest.config.ts` sets `testTimeout: 30s` because scaffold tests do real I/O and `git init`.
