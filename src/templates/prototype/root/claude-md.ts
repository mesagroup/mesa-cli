import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function renderRoot(config: PrototypeConfig): string {
  return `# ${config.name}

${config.description}

## Stack

- Next.js 15 (App Router) + Tailwind v4 — \`apps/web\`
- Hono — mounted under \`apps/web/src/app/api/[...route]/route.ts\`
- Neon Postgres + Drizzle ORM — \`packages/db\`
- Vercel Blob for file storage — \`apps/api/src/lib/storage.ts\`
- Username + password auth (bcryptjs + jose JWT) — \`apps/api/src/routes/auth.ts\`
- Vercel + GitHub Actions (manual-only deploy)

## Common commands

- Install: \`pnpm install\`
- Dev: \`pnpm dev\`
- Build: \`pnpm build\`
- Lint: \`pnpm lint\`
- Test: \`pnpm test\`
- DB push: \`pnpm db:push\`
- DB studio: \`pnpm db:studio\`
- Verify architecture: \`mesa verify\`

## Rules

See \`.cursor/rules/\` and \`.claude/skills/\` for the full development rules and
recurring workflows. Highlights:

- REST endpoints only (no GraphQL).
- No SQLite — Neon Postgres only.
- Username + password auth with bcrypt + JWT.
- File storage via \`@vercel/blob\` only.
- \`production\` and \`preview\` environments must be declared in GitHub Actions.
- Manual-only deploy via \`gh workflow run deploy.yml -f environment=<preview|production>\`.
`;
}

export function renderProject(config: PrototypeConfig): string {
  return `# ${config.name} — Development Rules

Project type: **MESA Prototype** (Vercel + Next.js + Hono + Neon)

## Constraints

### V1 — Managed Postgres only (Neon)
The database is **Neon Postgres**, accessed via \`@neondatabase/serverless\` and
**Drizzle ORM**. SQLite (and any \`sqlite://\`/\`file:*.db\` connection string) is
forbidden — \`mesa verify\` blocks it.

### V2 — REST endpoints
All endpoints are REST. The Hono app is mounted at \`/api/*\` via the Next.js
App Router catch-all (\`apps/web/src/app/api/[...route]/route.ts\`). GraphQL is
not allowed.

### V3 — Username + password authentication
Auth uses **username + password** stored as a bcrypt hash in the \`users\` table.
On login, a JWT is issued with \`jose\`. Protected routes use the JWT middleware
(\`apps/api/src/middleware/auth.ts\`).

### V4 — Vercel Blob for storage
File uploads go to **Vercel Blob** (\`@vercel/blob\`) using
\`BLOB_READ_WRITE_TOKEN\`. No filesystem writes for user content.

### V5 — Production + preview environments
\`production\` and \`preview\` are declared as GitHub Actions environments in
\`.github/workflows/deploy.yml\`. Secrets are scoped per environment in GitHub
and Vercel.

### V6 — Manual deploys only
\`deploy.yml\` uses \`on: workflow_dispatch:\` with an \`environment\` input. CI
(\`ci.yml\`) runs on push/PR for lint + build but never deploys.

### V7 — Validated environment variables
All env vars are parsed by Zod in \`apps/api/src/env.ts\`. Missing required
variables fail loudly at startup.

### V8 — Centralized error handling
Hono routes use \`app.onError()\` and never leak stack traces. Auth failures
return a generic 401.

### V9 — Strict TypeScript, no \`any\`
\`tsconfig.json\` enables \`strict\`. Use \`unknown\` and narrow.

### V10 — Reproducible installs
Use \`pnpm install --frozen-lockfile\` in CI.

## Anti-patterns to block

- **No SQLite** — \`sqlite3\`, \`better-sqlite3\`, \`@libsql/client\`, etc.
- **No GraphQL** — \`graphql\`, \`@apollo/server\`, \`@apollo/client\`.
- **No password storage in plaintext** — always bcrypt/argon2.
- **No \`origin: *\`** with credentials.
- **No \`process.env.X\`** outside the validated env module.
- **No automatic deploy on push/PR** — manual workflow_dispatch only.
- **No filesystem writes for user uploads** — Vercel Blob only.
`;
}
