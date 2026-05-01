import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function render(_config: PrototypeConfig): string {
  return `import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const url = process.env.NEON_DATABASE_URL;
if (!url) {
  throw new Error('NEON_DATABASE_URL is not set — see .env.example');
}

const sqlClient = neon(url);
export const db = drizzle(sqlClient, { schema });
`;
}
