import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function render(_config: PrototypeConfig): string {
  return `import { defineConfig } from 'drizzle-kit';

const url = process.env.NEON_DATABASE_URL;
if (!url) {
  throw new Error('NEON_DATABASE_URL is not set — see .env.example');
}

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
`;
}
