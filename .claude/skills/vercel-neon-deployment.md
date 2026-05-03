---
name: vercel-neon-deployment
description: How to deploy a `mesa prototype` project (Vercel + Next.js + Hono + Neon). Use when shipping the first deploy or onboarding a new environment.
when_to_use:
  - first-time setup of a prototype project
  - adding a new environment (e.g. staging)
  - debugging "why didn't my push deploy?" — answer: by design, deploys are manual
---

# Vercel + Neon deployment

## One-time setup

```bash
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
vercel env add NEON_DATABASE_URL production
vercel env add NEON_DATABASE_URL preview
vercel env add NEON_DATABASE_URL development

vercel env add JWT_SECRET production              # openssl rand -hex 32
vercel env add JWT_SECRET preview
vercel env add JWT_SECRET development

vercel env add BLOB_READ_WRITE_TOKEN production   # from `vercel blob store create`
vercel env add BLOB_READ_WRITE_TOKEN preview
vercel env add BLOB_READ_WRITE_TOKEN development

# 4. GitHub environments
# In the GitHub UI: Settings → Environments → New environment
# Create both `preview` and `production`, add required reviewers for production.
# Add VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID as secrets in BOTH environments.
```

## Manual deploy

This project is configured for **manual-only** deploys. CI runs lint + build on
every push/PR but never deploys. To deploy:

```bash
gh workflow run deploy.yml -f environment=preview
gh workflow run deploy.yml -f environment=production
```

You can also trigger from the GitHub Actions UI (Run workflow → choose environment).

## Database migrations

Drizzle schema changes:

```bash
# Local dev: push schema directly to your Neon dev branch
pnpm db:push

# For prod/preview: generate a migration, commit it, then run as part of deploy
pnpm db:generate
git add drizzle/ && git commit -m "db: add foo column"
pnpm db:migrate
```

Always test the migration on a Neon **branch** before applying to main.

## Rollback

```bash
vercel rollback              # In the Vercel dashboard or CLI
```

For DB rollback, restore the Neon branch to a point-in-time (Neon UI → Branches → Restore).

## Troubleshooting

- **"Not Found" on /api/...** — Hono is mounted at `apps/web/src/app/api/[...route]/route.ts`.
- **JWT `invalid signature`** — `JWT_SECRET` differs between issuer and verifier.
- **Neon connection timeouts** — use the **pooled** connection string (`-pooler` suffix).
