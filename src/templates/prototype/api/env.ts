import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function render(_config: PrototypeConfig): string {
  return `import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'preview', 'production', 'test']).default('development'),

  // Database (Neon Postgres pooled connection)
  NEON_DATABASE_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ISSUER: z.string().default('mesa-prototype'),
  JWT_AUDIENCE: z.string().default('mesa-prototype'),

  // Vercel Blob
  BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
});

let cached: z.infer<typeof envSchema> | null = null;

/**
 * Returns the validated runtime environment.
 *
 * Throws when required vars are missing. Callers can defer the call until
 * an actual route runs, so that imports never fail on a missing var at
 * build/import time (helps Next.js static analysis on Vercel).
 */
export function env() {
  if (cached) return cached;
  cached = envSchema.parse(process.env);
  return cached;
}

export type Env = z.infer<typeof envSchema>;
`;
}
