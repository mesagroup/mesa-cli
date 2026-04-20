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

- The linter (`xo`) reports many errors related to missing `.js` file extensions in imports and `prettier/prettier` formatting. These are pre-existing in the codebase and not regressions (~4500 errors as of v1.2.2).
- The scaffold test suite spawns real `git init` / `git commit` subprocesses for every project variant; total runtime is ~30s and individual test timeout is set to 30s in `vitest.config.ts`.
- The CLI's `mesa setup` command checks for external tools (Docker, .NET SDK, Aspire CLI, GitHub CLI) — these are **not** needed for developing the CLI itself, only for projects the CLI generates.
- To exercise the CLI after building: `node dist/cli.js init <name> --dry-run -y` (dry-run mode previews scaffolding without writing files).
