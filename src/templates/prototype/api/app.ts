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

// Comma-separated list of allowed origins. Default: same-origin only.
// Example: CORS_ALLOW_ORIGINS=https://app.example.com,https://staging.example.com
const allowList = (process.env.CORS_ALLOW_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return null; // Same-origin requests have no Origin header.
      return allowList.includes(origin) ? origin : null;
    },
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
