import path from 'node:path';
import { collectAllDeps, walkByExt, safeRead, walkFiles } from '../fs-helpers';
import type { Check, CheckResult } from '../types';

const FORBIDDEN_DEPS = new Set([
  'sqlite3',
  'better-sqlite3',
  '@libsql/client',
  'libsql',
  '@prisma/adapter-libsql',
  'expo-sqlite',
  'react-native-sqlite-storage',
]);

const SQLITE_URL_RE = /(?:^|=|"|')(sqlite:\/\/|libsql:\/\/|file:\/?\/?[^\s"']+\.(?:db|sqlite|sqlite3))/i;
const SQLITE_DRIVER_IMPORT_RE =
  /(?:from|require\s*\()\s*["'](drizzle-orm\/(?:better-sqlite3|libsql|expo-sqlite)|@prisma\/adapter-libsql)["']/;

export const notSqlite: Check = async (cwd): Promise<CheckResult> => {
  const evidence: string[] = [];

  // 1. Forbidden dependencies in any package.json.
  const { deps } = collectAllDeps(cwd);
  for (const dep of deps) {
    if (FORBIDDEN_DEPS.has(dep)) {
      evidence.push(`dependency: ${dep}`);
    }
  }

  // 2. Connection-string-style references in env files and source.
  const envFiles: string[] = [];
  for (const file of walkFiles(cwd)) {
    const base = path.basename(file);
    if (
      base === '.env' ||
      base === '.env.local' ||
      base === '.env.production' ||
      base === '.env.preview' ||
      base === '.env.example' ||
      base === '.env.development'
    ) {
      envFiles.push(file);
    }
  }
  for (const file of envFiles) {
    const content = safeRead(file);
    if (SQLITE_URL_RE.test(content)) {
      evidence.push(`${path.relative(cwd, file)}: SQLite-style connection string`);
    }
  }

  // 3. Driver imports in source.
  for (const file of walkByExt(cwd, ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])) {
    const content = safeRead(file);
    if (SQLITE_DRIVER_IMPORT_RE.test(content)) {
      evidence.push(`${path.relative(cwd, file)}: SQLite driver import`);
    }
  }

  if (evidence.length === 0) {
    return {
      id: 'not-sqlite',
      title: 'Database is not SQLite',
      passed: true,
      message: 'No SQLite dependencies, drivers, or connection strings detected.',
    };
  }

  return {
    id: 'not-sqlite',
    title: 'Database is not SQLite',
    passed: false,
    message: 'SQLite usage detected. Use a managed Postgres (e.g. Neon) or another non-SQLite engine.',
    evidence,
  };
};
