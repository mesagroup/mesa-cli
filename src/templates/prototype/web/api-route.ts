import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function render(config: PrototypeConfig): string {
  return `import { handle } from 'hono/vercel';
import { app } from '@${config.name}/api';

// Hono is mounted as a Next.js Route Handler. Every method is forwarded.
// Run via \`pnpm dev\` (Next.js handles requests; the same code path runs on Vercel).
export const runtime = 'nodejs';

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);
export const HEAD = handle(app);
`;
}
