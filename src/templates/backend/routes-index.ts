import type { ScaffoldConfig } from '../../types/scaffold';

export function render(_config: ScaffoldConfig): string {
	return `import { Router } from 'express';
import { healthRouter } from './health';

const router = Router();

router.use('/health', healthRouter);

export const apiRouter = router;
`;
}
