/**
 * Claude / Cursor "skills" shared by `mesa init` and `mesa prototype`.
 * Each file has YAML frontmatter (name, description) and a body
 * describing when and how to use the skill.
 */

export function renderArchitectureAuditSkill(): string {
  return `---
name: architecture-audit
description: Run \`mesa verify\` to audit a generated project against MESA architecture best practices. Use after finishing a feature or before opening a PR.
when_to_use:
  - finishing a feature on a generated project
  - reviewing a PR for architectural drift
  - investigating "is this project still MESA-compliant?"
---

# Architecture audit

When you finish a feature or before merging, run:

\`\`\`bash
mesa verify              # Pretty table
mesa verify --explain    # Show evidence per check
mesa verify --json       # Machine-readable, suitable for CI
\`\`\`

The five checks:

1. **Database is not SQLite** — fails on \`sqlite3\`, \`better-sqlite3\`, \`@libsql/client\`,
   Drizzle SQLite drivers, or \`sqlite://\`/\`file:*.db\` connection strings.
2. **Endpoints are REST** — passes when Hono/Express \`app.<method>(...)\` calls or
   Next.js \`route.ts\` HTTP method exports are present, fails on GraphQL artifacts.
3. **Authentication uses username + password** — requires a hashing dependency
   (bcrypt/bcryptjs/argon2/@node-rs/argon2) AND source files referencing both
   \`password\` and \`username\`/\`email\`.
4. **Storage uses Vercel Blob** — requires \`@vercel/blob\` in deps OR
   \`BLOB_READ_WRITE_TOKEN\` referenced in code/env.
5. **Production + preview environments** — requires both \`environment: production\`
   and \`environment: preview\` in a \`.github/workflows/*.yml\` file (or in
   \`.vercel/project.json\` / \`vercel.json\`).

## Common failures

- **vercel-blob-storage failed** → run \`pnpm add @vercel/blob\` in the API package
  and use \`put()\` from \`@vercel/blob\` for uploads. Add \`BLOB_READ_WRITE_TOKEN\`
  to \`.env.example\`.
- **environments-prod-preview failed** → add \`environment: production\` and
  \`environment: preview\` job-level keys in your deploy workflow. Configure both
  environments in GitHub Settings → Environments.
- **auth-username-password failed** → add \`bcryptjs\` or \`argon2\` and write the
  \`/register\` + \`/login\` routes hashing the password.
- **rest-endpoints failed** → ensure routes use Hono/Express method calls or
  Next.js \`export async function GET(...)\` style. Remove GraphQL deps if you
  don't use them.
- **not-sqlite failed** → migrate to Neon Postgres (\`@neondatabase/serverless\`
  + Drizzle); update connection string and remove the SQLite dep.

## CI integration

\`\`\`yaml
- name: Architecture verify
  run: npx @mesagroup/mesa-cli verify --json
\`\`\`
`;
}

export function renderRestApiDesignSkill(): string {
  return `---
name: rest-api-design
description: REST conventions enforced across MESA projects. Use when designing new endpoints or reviewing existing routes.
when_to_use:
  - designing a new API endpoint
  - reviewing PR that adds/changes routes
  - resolving "should this be POST or PUT?" type questions
---

# REST API design

## Resources & methods

| Verb   | Path                       | Purpose                          | Success status |
| ------ | -------------------------- | -------------------------------- | -------------- |
| GET    | \`/api/widgets\`            | List (paginated)                 | 200            |
| GET    | \`/api/widgets/:id\`        | Read one                         | 200            |
| POST   | \`/api/widgets\`            | Create (server assigns id)       | 201            |
| PUT    | \`/api/widgets/:id\`        | Replace (idempotent)             | 200 or 204     |
| PATCH  | \`/api/widgets/:id\`        | Partial update                   | 200            |
| DELETE | \`/api/widgets/:id\`        | Delete                           | 204            |

- **Resource names are plural nouns**. \`/api/users\`, not \`/api/getUser\`.
- **Sub-resources** for ownership: \`/api/users/:id/uploads\`.
- **No verbs in URLs** except for clear action endpoints (\`/api/auth/login\`).

## Status codes

- 200 OK — successful read or update.
- 201 Created — successful create. Include \`Location\` header.
- 204 No Content — successful delete or update with no body.
- 400 Bad Request — validation failed (Zod error).
- 401 Unauthorized — no/invalid token.
- 403 Forbidden — token is valid but caller lacks permission.
- 404 Not Found — resource doesn't exist (or caller can't see it).
- 409 Conflict — duplicate (e.g. username already taken).
- 422 Unprocessable Entity — semantic validation (e.g. business rule).
- 500 Internal Server Error — unexpected.

## Pagination

\`\`\`http
GET /api/widgets?limit=50&cursor=eyJpZCI6MTIzfQ
\`\`\`

Response:

\`\`\`json
{
  "data": [ ... ],
  "nextCursor": "eyJpZCI6MTczfQ",
  "hasMore": true
}
\`\`\`

Use opaque base64-encoded cursors. Never expose internal offsets/IDs raw.

## Versioning

- Default: no version prefix. Breaking changes = new resource path or query flag.
- If versioning is needed: \`/api/v2/widgets\` (path versioning).
- Never \`?version=2\` or \`Accept: application/vnd.mesa.v2+json\` (too clever).

## Errors

\`\`\`json
{
  "error": "username already taken",
  "code": "USERNAME_TAKEN"
}
\`\`\`

- Always \`error\` (string). Optionally \`code\` (UPPER_SNAKE machine ID).
- Never include stack traces or internal field names.

## Security

- All non-public endpoints require JWT (\`Authorization: Bearer <token>\`).
- Validate request body, query, and headers with Zod.
- Rate-limit \`/api/auth/login\` and \`/api/auth/register\`.
`;
}

export function renderSecretsManagementSkill(): string {
  return `---
name: secrets-management
description: How to manage env vars and secrets across MESA projects (production / preview / development).
when_to_use:
  - adding a new env var
  - rotating credentials
  - debugging "where does this secret live?"
---

# Secrets management

## The 3 environments

| Environment    | Where it runs                              | Secrets live in                           |
| -------------- | ------------------------------------------ | ----------------------------------------- |
| \`development\` | Local dev (\`pnpm dev\`)                    | \`.env.local\` (gitignored)                |
| \`preview\`     | Vercel previews (per branch / PR)          | Vercel env vars + GitHub env "preview"    |
| \`production\`  | Vercel production deployment (\`main\`)     | Vercel env vars + GitHub env "production" |

## Adding a new env var

1. Document it in \`.env.example\` with a placeholder.
2. Validate it in \`apps/api/src/env.ts\` with Zod.
3. Add it to Vercel:
   \`\`\`bash
   vercel env add MY_VAR development
   vercel env add MY_VAR preview
   vercel env add MY_VAR production
   \`\`\`
4. Add it to GitHub Secrets (per environment) if used by CI:
   \`Settings → Secrets and variables → Actions → Environments\`.
5. Update \`apps/api/src/env.ts\` Zod schema.

## Rotation

- Generate the new value first.
- Add it as the new secret value alongside the old one (if your code supports
  fallback). Otherwise schedule a brief downtime.
- Replace in Vercel + GitHub.
- Re-deploy preview, smoke test, then production.
- Revoke the old credential at the source (Neon, Vercel Blob, etc.).

## What never goes in source

- Database URLs with credentials.
- JWT secrets / private keys.
- API tokens (Vercel, GitHub, Neon, etc.).
- Customer PII or sample data with real names/emails.

## Verification

\`\`\`bash
git grep -E '(JWT_SECRET|DATABASE_URL|BLOB_READ_WRITE_TOKEN)' -- ':!*.example' ':!*.md'
\`\`\`

Should return nothing. CI can run this as a pre-commit / pre-merge check.

## Vercel env scoping

When you add a secret in Vercel, you choose one or more of \`development\`,
\`preview\`, \`production\`. Default to **all three** for non-sensitive config and
**preview + production only** for production credentials.
`;
}

export function renderVercelNeonDeploymentSkill(): string {
  return `---
name: vercel-neon-deployment
description: How to deploy a \`mesa prototype\` project (Vercel + Next.js + Hono + Neon). Use when shipping the first deploy or onboarding a new environment.
when_to_use:
  - first-time setup of a prototype project
  - adding a new environment (e.g. staging)
  - debugging "why didn't my push deploy?"
---

# Vercel + Neon deployment

## One-time setup

\`\`\`bash
# 1. Vercel CLI
npm i -g vercel
vercel login
cd <project>
vercel link                 # Choose / create a Vercel project

# 2. Neon
# Create a project at https://neon.tech, then create two branches:
#   - main         → used by production
#   - preview      → used by preview deployments
# Copy each pooled connection string.

# 3. Vercel env vars
vercel env add NEON_DATABASE_URL production       # paste main pooled connection
vercel env add NEON_DATABASE_URL preview          # paste preview pooled connection
vercel env add NEON_DATABASE_URL development      # local-only dev branch (optional)

vercel env add JWT_SECRET production              # generated with openssl rand -hex 32
vercel env add JWT_SECRET preview
vercel env add JWT_SECRET development

vercel env add BLOB_READ_WRITE_TOKEN production   # from \`vercel blob store create\`
vercel env add BLOB_READ_WRITE_TOKEN preview
vercel env add BLOB_READ_WRITE_TOKEN development

# 4. GitHub environments
# In the GitHub UI: Settings → Environments → New environment
# Create both \`preview\` and \`production\`, add required reviewers for production.
# Add VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID as secrets in BOTH environments.
\`\`\`

## Manual deploy

This project is configured for **manual-only** deploys. CI runs lint + build on
every push/PR but never deploys. To deploy:

\`\`\`bash
gh workflow run deploy.yml -f environment=preview
gh workflow run deploy.yml -f environment=production
\`\`\`

You can also trigger from the GitHub Actions UI (Run workflow → choose environment).

## Database migrations

Drizzle schema changes:

\`\`\`bash
# Local dev: push schema directly to your Neon dev branch
pnpm db:push

# For prod/preview: generate a migration, commit it, then run as part of deploy
pnpm db:generate                                  # writes drizzle/<n>_<name>.sql
git add drizzle/ && git commit -m "db: add foo column"
pnpm db:migrate                                   # apply to current NEON_DATABASE_URL
\`\`\`

Always test the migration on a Neon **branch** before applying to main.

## Rollback

\`\`\`bash
vercel rollback              # In the Vercel dashboard or CLI
\`\`\`

For DB rollback, restore the Neon branch to a point-in-time (Neon UI → Branches → Restore).

## Troubleshooting

- **"Not Found" on /api/...** — Hono is mounted at \`apps/web/src/app/api/[...route]/route.ts\`.
  Check that it re-exports the Hono Vercel handler.
- **JWT \`invalid signature\`** — \`JWT_SECRET\` differs between issuer and verifier.
  Verify Vercel env per environment.
- **Neon connection timeouts** — use the **pooled** connection string
  (\`-pooler\` suffix), not the direct one.
`;
}
