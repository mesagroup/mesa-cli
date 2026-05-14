import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function render(_config: PrototypeConfig): string {
  return `import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Lazy initialization: NEON_DATABASE_URL must not be required at import time
// (Next.js page-data collection / build will import this without env vars set).
let _db: NeonHttpDatabase<typeof schema> | undefined;

function init(): NeonHttpDatabase<typeof schema> {
  const url = process.env.NEON_DATABASE_URL;
  if (!url) {
    throw new Error('NEON_DATABASE_URL is not set — see .env.example');
  }
  return drizzle(neon(url), { schema });
}

export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop, receiver) {
    if (!_db) _db = init();
    return Reflect.get(_db, prop, receiver);
  },
});
`;
}
