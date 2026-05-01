import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function render(_config: PrototypeConfig): string {
  return `import { put, type PutBlobResult } from '@vercel/blob';
import { env } from '../env';

/**
 * Upload a file to Vercel Blob using BLOB_READ_WRITE_TOKEN.
 *
 * \`pathname\` is the storage key. Pass a user-scoped prefix to avoid clashes,
 * e.g. \`u/<user.id>/<filename>\`.
 */
export async function uploadBlob(
  pathname: string,
  body: Blob | File | ArrayBuffer | Uint8Array | string,
): Promise<PutBlobResult> {
  const e = env();
  if (!e.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set — see .env.example');
  }
  return put(pathname, body, {
    access: 'public',
    token: e.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: true,
  });
}
`;
}
