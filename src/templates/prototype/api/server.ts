import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function render(_config: PrototypeConfig): string {
  return `import { serve } from '@hono/node-server';
import { app } from './app';

const port = Number(process.env.PORT ?? 4000);

serve({ fetch: app.fetch, port }, info => {
  console.log(\`[api] listening on http://localhost:\${info.port}\`);
});
`;
}
