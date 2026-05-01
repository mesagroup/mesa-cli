import path from 'node:path';
import { collectAllDeps, walkByExt, safeRead } from '../fs-helpers';
import type { Check, CheckResult } from '../types';

const HASH_DEPS = new Set([
  'bcrypt',
  'bcryptjs',
  'argon2',
  '@node-rs/argon2',
  '@node-rs/bcrypt',
  'scrypt',
  'scrypt-js',
  '@noble/hashes',
]);

const USERNAME_RE = /\b(username|user_name|userName|email)\b/i;
const PASSWORD_RE = /\bpassword\b/i;

export const authUsernamePassword: Check = async (cwd): Promise<CheckResult> => {
  const evidence: string[] = [];

  // 1. Hashing dependency present?
  const { deps } = collectAllDeps(cwd);
  const hashDeps: string[] = [];
  for (const dep of deps) {
    if (HASH_DEPS.has(dep)) hashDeps.push(dep);
  }

  if (hashDeps.length === 0) {
    return {
      id: 'auth-username-password',
      title: 'Authentication uses username + password',
      passed: false,
      message:
        'No password-hashing dependency detected (bcrypt, bcryptjs, argon2, @node-rs/argon2, scrypt).',
    };
  }

  evidence.push(`hashing dependencies: ${hashDeps.join(', ')}`);

  // 2. Source contains co-located password + username/email references.
  const matchingFiles: string[] = [];
  for (const file of walkByExt(cwd, ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])) {
    const content = safeRead(file);
    if (PASSWORD_RE.test(content) && USERNAME_RE.test(content)) {
      matchingFiles.push(path.relative(cwd, file));
    }
  }

  if (matchingFiles.length === 0) {
    return {
      id: 'auth-username-password',
      title: 'Authentication uses username + password',
      passed: false,
      message:
        'Hashing library installed, but no source files reference both password and username/email.',
      evidence,
    };
  }

  evidence.push(...matchingFiles.slice(0, 5));

  return {
    id: 'auth-username-password',
    title: 'Authentication uses username + password',
    passed: true,
    message: `Password hashing + credential code present (${matchingFiles.length} file(s)).`,
    evidence,
  };
};
