import type { Check, CheckResult } from './types';
import { notSqlite } from './checks/not-sqlite';
import { restEndpoints } from './checks/rest-endpoints';
import { authUsernamePassword } from './checks/auth-username-password';
import { vercelBlobStorage } from './checks/vercel-blob-storage';
import { environmentsProductionPreview } from './checks/environments';

export type { Check, CheckResult };

export const ALL_CHECKS: Check[] = [
  notSqlite,
  restEndpoints,
  authUsernamePassword,
  vercelBlobStorage,
  environmentsProductionPreview,
];

export async function runChecks(cwd: string): Promise<CheckResult[]> {
  return Promise.all(ALL_CHECKS.map(check => check(cwd)));
}
