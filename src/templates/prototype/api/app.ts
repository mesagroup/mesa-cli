import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function render(_config: PrototypeConfig): string {
  return `import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { health } from './routes/health';
import { auth } from './routes/auth';
import { me } from './routes/me';
import { uploads } from './routes/uploads';

export const app = new Hono().basePath('/api');

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (origin) => origin ?? '*',
    credentials: true,
  }),
);

app.route('/health', health);
app.route('/auth', auth);
app.route('/me', me);
app.route('/uploads', uploads);

app.onError((err, c) => {
  console.error('[api] unhandled error', err);
  return c.json({ error: 'internal_server_error' }, 500);
});

app.notFound((c) => c.json({ error: 'not_found' }, 404));

export type AppType = typeof app;
`;
}
