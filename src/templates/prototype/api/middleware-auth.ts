import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function render(_config: PrototypeConfig): string {
  return `import { createMiddleware } from 'hono/factory';
import { jwtVerify, type JWTPayload } from 'jose';
import { env } from '../env';

export interface AuthVariables {
  user: {
    id: number;
    username: string;
    payload: JWTPayload;
  };
}

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const header = c.req.header('authorization');
  if (!header?.toLowerCase().startsWith('bearer ')) {
    return c.json({ error: 'missing_authorization' }, 401);
  }
  const token = header.slice(7).trim();

  const e = env();
  const secret = new TextEncoder().encode(e.JWT_SECRET);

  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: e.JWT_ISSUER,
      audience: e.JWT_AUDIENCE,
    });
    const sub = payload.sub;
    const username = typeof payload.username === 'string' ? payload.username : '';
    if (!sub) {
      return c.json({ error: 'invalid_token' }, 401);
    }
    c.set('user', { id: Number(sub), username, payload });
  } catch (err) {
    console.error('[auth] jwt verify failed:', (err as Error).message);
    return c.json({ error: 'invalid_token' }, 401);
  }

  await next();
});
`;
}
