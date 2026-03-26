import type { ScaffoldConfig } from '../../types/scaffold';

export function render(_config: ScaffoldConfig): string {
	return `import { Router, type Request, type Response } from 'express';
import { getPool } from '../services/db';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const pool = await getPool();
    await pool.request().query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.json({ status: 'degraded', db: 'disconnected' });
  }
});

export const healthRouter = router;
`;
}
