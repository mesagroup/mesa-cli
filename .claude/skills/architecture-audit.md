---
name: architecture-audit
description: Run `mesa verify` to audit a generated project against MESA architecture best practices. Use after finishing a feature or before opening a PR.
when_to_use:
  - finishing a feature on a generated project
  - reviewing a PR for architectural drift
  - investigating "is this project still MESA-compliant?"
---

# Architecture audit

When you finish a feature or before merging, run:

```bash
mesa verify              # Pretty table
mesa verify --explain    # Show evidence per check
mesa verify --json       # Machine-readable, suitable for CI
```

The five checks:

1. **Database is not SQLite** — fails on `sqlite3`, `better-sqlite3`, `@libsql/client`,
   Drizzle SQLite drivers, or `sqlite://`/`file:*.db` connection strings.
2. **Endpoints are REST** — passes when Hono/Express `app.<method>(...)` calls or
   Next.js `route.ts` HTTP method exports are present, fails on GraphQL artifacts.
3. **Authentication uses username + password** — requires a hashing dependency
   (bcrypt/bcryptjs/argon2/@node-rs/argon2) AND source files referencing both
   `password` and `username`/`email`.
4. **Storage uses Vercel Blob** — requires `@vercel/blob` in deps OR
   `BLOB_READ_WRITE_TOKEN` referenced in code/env.
5. **Production + preview environments** — requires both `environment: production`
   and `environment: preview` in a `.github/workflows/*.yml` file (or in
   `.vercel/project.json` / `vercel.json`).

## Common failures

- **vercel-blob-storage failed** → run `pnpm add @vercel/blob` in the API package
  and use `put()` from `@vercel/blob` for uploads. Add `BLOB_READ_WRITE_TOKEN`
  to `.env.example`.
- **environments-prod-preview failed** → add `environment: production` and
  `environment: preview` job-level keys in your deploy workflow.
- **auth-username-password failed** → add `bcryptjs` or `argon2` and write the
  `/register` + `/login` routes hashing the password.
- **rest-endpoints failed** → ensure routes use Hono/Express method calls or
  Next.js `export async function GET(...)` style. Remove GraphQL deps.
- **not-sqlite failed** → migrate to Neon Postgres (`@neondatabase/serverless`
  + Drizzle); update connection string and remove the SQLite dep.

## CI integration

```yaml
- name: Architecture verify
  run: npx @mesagroup/mesa-cli verify --json
```
