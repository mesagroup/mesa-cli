import type { ScaffoldConfig } from '../../types/scaffold';

export function render(_config: ScaffoldConfig): string {
  return `import { type Request, type Response, type NextFunction } from 'express';
import { jwtVerify, importSPKI, type JWTPayload } from 'jose';
import { env } from '../config/env';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export async function authJwt(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    let secret: Uint8Array | CryptoKey;

    if (env.JWT_PUBLIC_KEY) {
      secret = await importSPKI(env.JWT_PUBLIC_KEY, 'RS256');
    } else if (env.JWT_SECRET) {
      secret = new TextEncoder().encode(env.JWT_SECRET);
    } else {
      throw new Error('No JWT_SECRET or JWT_PUBLIC_KEY configured');
    }

    const { payload } = await jwtVerify(token, secret, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });

    req.user = payload;
    next();
  } catch (err) {
    // NEVER log the full token
    console.error('[Auth] JWT verification failed:', (err as Error).message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
`;
}
