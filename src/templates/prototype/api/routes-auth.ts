import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function render(config: PrototypeConfig): string {
  return `import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { eq } from 'drizzle-orm';
import { db, users } from '@${config.name}/db';
import { env } from '../env';

export const auth = new Hono();

const credentialsSchema = z.object({
  username: z.string().min(3).max(64).regex(/^[a-zA-Z0-9_.-]+$/, {
    message: 'username may only contain letters, digits, underscore, dot, hyphen',
  }),
  password: z.string().min(12, 'password must be at least 12 characters').max(256),
});

async function issueToken(userId: number, username: string): Promise<string> {
  const e = env();
  const secret = new TextEncoder().encode(e.JWT_SECRET);
  return new SignJWT({ sub: String(userId), username })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setIssuer(e.JWT_ISSUER)
    .setAudience(e.JWT_AUDIENCE)
    .setExpirationTime('1h')
    .sign(secret);
}

auth.post('/register', zValidator('json', credentialsSchema), async (c) => {
  const { username, password } = c.req.valid('json');

  const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (existing.length > 0) {
    return c.json({ error: 'username_taken', code: 'USERNAME_TAKEN' }, 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [created] = await db
    .insert(users)
    .values({ username, passwordHash })
    .returning({ id: users.id, username: users.username });

  const token = await issueToken(created.id, created.username);
  return c.json({ user: created, token }, 201);
});

auth.post('/login', zValidator('json', credentialsSchema), async (c) => {
  const { username, password } = c.req.valid('json');

  const found = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (found.length === 0) {
    return c.json({ error: 'invalid_credentials' }, 401);
  }
  const user = found[0];

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return c.json({ error: 'invalid_credentials' }, 401);
  }

  const token = await issueToken(user.id, user.username);
  return c.json({ user: { id: user.id, username: user.username }, token });
});
`;
}
