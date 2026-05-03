---
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
| `development`  | Local dev (`pnpm dev`)                     | `.env.local` (gitignored)                 |
| `preview`      | Vercel previews (per branch / PR)          | Vercel env vars + GitHub env "preview"    |
| `production`   | Vercel production deployment (`main`)      | Vercel env vars + GitHub env "production" |

## Adding a new env var

1. Document it in `.env.example` with a placeholder.
2. Validate it in `apps/api/src/env.ts` with Zod.
3. Add it to Vercel:
   ```bash
   vercel env add MY_VAR development
   vercel env add MY_VAR preview
   vercel env add MY_VAR production
   ```
4. Add it to GitHub Secrets (per environment) if used by CI.
5. Update the Zod schema.

## Rotation

- Generate the new value first.
- Add it as the new secret value alongside the old one (if your code supports
  fallback). Otherwise schedule a brief downtime.
- Replace in Vercel + GitHub.
- Re-deploy preview, smoke test, then production.
- Revoke the old credential at the source.

## What never goes in source

- Database URLs with credentials.
- JWT secrets / private keys.
- API tokens (Vercel, GitHub, Neon).
- Customer PII or sample data with real names/emails.

## Verification

```bash
git grep -E '(JWT_SECRET|DATABASE_URL|BLOB_READ_WRITE_TOKEN)' -- ':!*.example' ':!*.md'
```

Should return nothing.
