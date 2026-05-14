import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function render(_config: PrototypeConfig): string {
  return `# Neon Postgres connection string
# Get one at https://neon.tech (Project → Connection Details → "Pooled connection")
NEON_DATABASE_URL=postgresql://user:password@ep-example-pooler.region.aws.neon.tech/neondb?sslmode=require

# JWT
# Generate with:  openssl rand -hex 32
JWT_SECRET=replace-me-with-at-least-32-random-bytes
JWT_ISSUER=mesa-prototype
JWT_AUDIENCE=mesa-prototype

# Vercel Blob
# Created with:  vercel blob store create
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_replace_me

# Public API base URL (used by the web app to call Hono)
NEXT_PUBLIC_API_URL=http://localhost:3000
`;
}
