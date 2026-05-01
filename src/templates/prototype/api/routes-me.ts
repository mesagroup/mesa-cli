import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function render(_config: PrototypeConfig): string {
  return `import { Hono } from 'hono';
import { requireAuth, type AuthVariables } from '../middleware/auth';

export const me = new Hono<{ Variables: AuthVariables }>();

me.use('*', requireAuth);

me.get('/', (c) => {
  const user = c.get('user');
  return c.json({ user: { id: user.id, username: user.username } });
});
`;
}
