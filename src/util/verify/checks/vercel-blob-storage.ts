import path from 'node:path';
import { collectAllDeps, walkFiles, walkByExt, safeRead } from '../fs-helpers';
import type { Check, CheckResult } from '../types';

const BLOB_TOKEN_RE = /BLOB_READ_WRITE_TOKEN/;

export const vercelBlobStorage: Check = async (cwd): Promise<CheckResult> => {
  const evidence: string[] = [];

  // 1. Dependency.
  const { deps } = collectAllDeps(cwd);
  if (deps.has('@vercel/blob')) {
    evidence.push('dependency: @vercel/blob');
  }

  // 2. Token referenced anywhere (env files / source).
  const envTargets: string[] = [];
  for (const file of walkFiles(cwd)) {
    const base = path.basename(file);
    if (base.startsWith('.env')) envTargets.push(file);
  }
  for (const file of envTargets) {
    if (BLOB_TOKEN_RE.test(safeRead(file))) {
      evidence.push(path.relative(cwd, file));
    }
  }
  for (const file of walkByExt(cwd, ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])) {
    if (BLOB_TOKEN_RE.test(safeRead(file))) {
      evidence.push(path.relative(cwd, file));
    }
  }

  if (evidence.length === 0) {
    return {
      id: 'vercel-blob-storage',
      title: 'Storage uses Vercel Blob',
      passed: false,
      message:
        'No reference to @vercel/blob or BLOB_READ_WRITE_TOKEN found. Use Vercel Blob for file storage.',
    };
  }

  return {
    id: 'vercel-blob-storage',
    title: 'Storage uses Vercel Blob',
    passed: true,
    message: 'Vercel Blob references detected.',
    evidence: [...new Set(evidence)].slice(0, 10),
  };
};
