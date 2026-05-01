import path from 'node:path';
import { existsSync } from 'node:fs';
import { walkFiles, safeRead, safeReadJson } from '../fs-helpers';
import type { Check, CheckResult } from '../types';

const PROD_RE = /environment:\s*production\b/;
const PREVIEW_RE = /environment:\s*preview\b/;

interface VercelProjectJson {
  env?: Array<{ target?: string[] }>;
}

export const environmentsProductionPreview: Check = async (cwd): Promise<CheckResult> => {
  const evidence: string[] = [];
  let foundProd = false;
  let foundPreview = false;

  // 1. GitHub Actions workflows.
  for (const file of walkFiles(cwd)) {
    const rel = path.relative(cwd, file);
    if (!rel.startsWith('.github/workflows/')) continue;
    if (!file.endsWith('.yml') && !file.endsWith('.yaml')) continue;
    const content = safeRead(file);
    let matched = false;
    if (PROD_RE.test(content)) {
      foundProd = true;
      matched = true;
    }
    if (PREVIEW_RE.test(content)) {
      foundPreview = true;
      matched = true;
    }
    if (matched) evidence.push(rel);
  }

  // 2. .vercel/project.json (when project is linked).
  const vercelProjectPath = path.join(cwd, '.vercel', 'project.json');
  if (existsSync(vercelProjectPath)) {
    const json = safeReadJson<VercelProjectJson>(vercelProjectPath);
    if (json?.env) {
      const targets = new Set<string>();
      for (const v of json.env) {
        for (const t of v.target ?? []) targets.add(t);
      }
      if (targets.has('production')) foundProd = true;
      if (targets.has('preview')) foundPreview = true;
      if (targets.size > 0) evidence.push('.vercel/project.json');
    }
  }

  // 3. vercel.json env section (rare but possible).
  const vercelJsonPath = path.join(cwd, 'vercel.json');
  if (existsSync(vercelJsonPath)) {
    const content = safeRead(vercelJsonPath);
    if (content.includes('"production"')) foundProd = true;
    if (content.includes('"preview"')) foundPreview = true;
    if (foundProd || foundPreview) evidence.push('vercel.json');
  }

  if (foundProd && foundPreview) {
    return {
      id: 'environments-prod-preview',
      title: 'Production and preview environments are defined',
      passed: true,
      message: 'Both `production` and `preview` environments are configured.',
      evidence: [...new Set(evidence)],
    };
  }

  const missing = [
    !foundProd ? 'production' : null,
    !foundPreview ? 'preview' : null,
  ]
    .filter(Boolean)
    .join(', ');

  return {
    id: 'environments-prod-preview',
    title: 'Production and preview environments are defined',
    passed: false,
    message: `Missing environment(s): ${missing}. Define them in a GitHub Actions workflow (job-level \`environment:\` key) or via \`vercel link\`.`,
    evidence: [...new Set(evidence)],
  };
};
