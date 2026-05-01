/**
 * Cursor rules shared by `mesa init` and `mesa prototype`.
 * Each file is a `.mdc` file under `.cursor/rules/` with YAML frontmatter.
 */

export function renderWebArchitectureRule(): string {
  return `---
description: MESA web architecture best practices
globs:
  - "**/*"
alwaysApply: true
---

# Web architecture rules

## Stack defaults

- **Database**: a managed Postgres (Neon, Supabase, RDS, Azure Postgres). **Never SQLite**
  for new projects. SQL Server is acceptable for MESAPPA on-prem plugins only.
- **Backend**: Express or Hono (Node.js) or Azure Functions for SaaS plugins.
- **Frontend**: Next.js 15 (App Router) or Angular 16 — depends on project type.
- **Storage**: Vercel Blob (\`@vercel/blob\`) for prototypes; Azure Blob for SaaS.
- **Auth**: username + password stored as bcrypt/argon2 hash, JWT issued with \`jose\`.

## Endpoints

- All HTTP endpoints are **REST**: resource nouns, plural, methods map to actions.
- No GraphQL in MESA projects unless explicitly approved.
- Use HTTP status codes correctly: 200 / 201 / 204 / 400 / 401 / 403 / 404 / 409 / 422 / 500.
- Pagination via \`?limit\` + \`?cursor\`; never \`?page\` over offset for large tables.
- Always return JSON: \`{ data: ..., error: ... }\` shape, never raw arrays at the top level
  for resources that may need pagination.

## Layering

- Routes are **thin**. They parse input (Zod), call a service, return JSON.
- Business logic lives in \`services/\`. Pure functions where possible.
- Database access lives in \`repositories/\` (or via the ORM client). Routes never
  touch the DB directly.

## Environments

- Always define **\`production\`** and **\`preview\`** environments in GitHub Actions
  (\`environment:\` job key) and in Vercel.
- Secrets are scoped per environment.
- No automatic deploy on push/PR. Use \`workflow_dispatch\` with an \`environment\`
  input, or a tag-triggered workflow.

## Verification

Run \`mesa verify\` before merging. CI should run it as well.
`;
}

export function renderSecurityRule(): string {
  return `---
description: MESA security & secrets management rules
globs:
  - "**/*"
alwaysApply: true
---

# Security rules

## Authentication

- Username/email + password is the default credential model.
- Passwords are stored only as **bcrypt** (\`bcryptjs\`) or **argon2** hashes. Never plaintext.
  Salt rounds: bcrypt \`>= 10\`, argon2 with default params.
- JWT signed with \`jose\` using HS256 (shared secret) or RS256 (key pair).
  Validate \`iss\`, \`aud\`, and \`exp\` on every request.
- Auth middleware protects every route except \`/api/health\` and \`/api/auth/*\`.

## Secrets

- Never commit \`.env\`. Only \`.env.example\` is tracked.
- Store secrets in:
  - **GitHub Secrets** (per environment) for CI/CD.
  - **Vercel env vars** (per environment: production / preview / development) for runtime.
- Never log tokens, passwords, or PII.
- Never embed credentials in URLs that may end up in logs.

## Input validation

- All external input (request body, query, headers, env vars) is validated with **Zod**.
- Reject invalid input with a clear 400 response (no stack trace).

## Database

- Use parameterized queries or an ORM (Drizzle / Prisma). **Never** string-concatenate
  user input into SQL.
- Apply schema migrations via the ORM tooling (\`pnpm db:push\` for prototyping,
  \`pnpm db:migrate\` for production).

## OWASP top-10 (short list)

- A01 Broken access control — auth middleware on every protected route, never trust
  client-side IDs without ownership checks.
- A02 Cryptographic failures — bcrypt/argon2 for passwords, HTTPS in production,
  no MD5/SHA-1 for security purposes.
- A03 Injection — parameterized queries, Zod for input validation.
- A05 Security misconfiguration — \`helmet()\` defaults, CORS whitelist (no \`origin: '*'\`
  with credentials), no debug logs in prod.
- A07 Auth failures — rate-limit \`/api/auth/login\`, lock accounts after N attempts,
  generic error messages.
- A08 Software/data integrity — \`pnpm install --frozen-lockfile\` in CI, signed commits.

## Errors

- Centralized error handler. Return \`{ error: "<short message>" }\` to clients.
  Log details internally. Never return \`err.message\` or stack traces.
`;
}

export function renderTestingRule(): string {
  return `---
description: MESA testing rules and conventions
globs:
  - "**/*.{test,spec}.{ts,tsx,js,jsx}"
alwaysApply: false
---

# Testing rules

## Frameworks

- **Vitest** for unit + integration tests.
- **Hono test client** (\`app.request(...)\`) for API integration tests.
- **Playwright** for end-to-end browser tests (when needed).

## Pyramid

- Lots of fast unit tests for pure functions (services, validators).
- Integration tests for routes (auth + happy + error paths).
- A handful of E2E tests for critical user journeys (login, create+upload, etc.).

## Conventions

- Test files are co-located: \`foo.ts\` ↔ \`foo.test.ts\`, OR under \`__tests__/\`.
- Each test is independent: no shared mutable state between tests.
- Use \`beforeEach\` to reset fixtures, \`afterEach\` to clean up temp files.
- For DB tests, use a separate \`appdb_test\` Neon branch (Neon supports branching).
- Snapshot tests sparingly — only for stable text output.

## Required coverage

- Auth: \`/register\` happy path, duplicate username, weak password rejection,
  \`/login\` correct, \`/login\` wrong password, expired JWT.
- Routes: 200 happy, 400 validation, 401 unauthenticated, 403 forbidden, 404 not found.
- Services: each business rule has at least one positive and one negative test.

## Anti-patterns

- No \`it.skip\` or \`it.todo\` left in main.
- No assertions on \`console.log\` output.
- No tests that depend on wall-clock time without freezing it.
`;
}
