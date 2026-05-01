import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function render(config: PrototypeConfig): string {
  return `import { Hono } from 'hono';
import { uploadBlob } from '../lib/storage';
import { requireAuth, type AuthVariables } from '../middleware/auth';
import { db, uploads as uploadsTable } from '@${config.name}/db';

export const uploads = new Hono<{ Variables: AuthVariables }>();

uploads.use('*', requireAuth);

uploads.post('/', async (c) => {
  const user = c.get('user');
  const form = await c.req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return c.json({ error: 'missing_file' }, 400);
  }

  const blob = await uploadBlob(\`u/\${user.id}/\${Date.now()}-\${file.name}\`, file);

  const [row] = await db
    .insert(uploadsTable)
    .values({ userId: user.id, blobUrl: blob.url, contentType: blob.contentType ?? null })
    .returning();

  return c.json({ upload: row }, 201);
});
`;
}
