import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function render(config: PrototypeConfig): string {
  return `import { Hono } from 'hono';
import { sql } from 'drizzle-orm';
import { db } from '@${config.name}/db';

export const health = new Hono();

health.get('/', async (c) => {
  let dbStatus: 'connected' | 'disconnected' = 'disconnected';
  try {
    await db.execute(sql\`select 1\`);
    dbStatus = 'connected';
  } catch (err) {
    console.error('[health] db check failed', err);
  }
  const status = dbStatus === 'connected' ? 'ok' : 'degraded';
  return c.json({ status, db: dbStatus }, dbStatus === 'connected' ? 200 : 503);
});
`;
}
