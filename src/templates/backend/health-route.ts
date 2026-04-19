import type { ScaffoldConfig } from '../../types/scaffold';
import { getDbModule } from '../db';

export function render(config: ScaffoldConfig): string {
  const db = getDbModule(config);
  return `import { Router, type Request, type Response } from 'express';
${db.getHealthCheckImport()}

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
${db.renderHealthCheck(config)}
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.json({ status: 'degraded', db: 'disconnected' });
  }
});

export const healthRouter = router;
`;
}
