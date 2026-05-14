import path from 'node:path';
import { collectAllDeps, walkByExt, safeRead } from '../fs-helpers';
import type { Check, CheckResult } from '../types';

// Match `<identifier>.<method>('/...', ...)` where method is an HTTP verb.
// Limit to file-scope identifier names (Hono router instances commonly use named
// constants like `auth`, `users`, etc.). We keep it permissive (any identifier)
// but require the path arg to start with a string literal to avoid matching
// chained methods like `c.get('user')`.
const REST_HANDLER_RE =
  /\b[A-Za-z_$][A-Za-z0-9_$]*\.(?:get|post|put|patch|delete|options|head)\s*\(\s*['"`]/;
const NEXT_ROUTE_EXPORT_RE =
  /^export\s+(?:async\s+)?(?:const|function)\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/m;

const GRAPHQL_DEPS = new Set([
  'graphql',
  '@apollo/server',
  '@apollo/client',
  'apollo-server',
  'apollo-server-express',
  'apollo-server-micro',
  '@nestjs/graphql',
  'mercurius',
  'type-graphql',
  'graphql-yoga',
]);

export const restEndpoints: Check = async (cwd): Promise<CheckResult> => {
  const restEvidence: string[] = [];
  const graphqlEvidence: string[] = [];

  // Source-level scan.
  for (const file of walkByExt(cwd, ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])) {
    const rel = path.relative(cwd, file);
    const content = safeRead(file);

    // Next.js App Router conventions: `route.ts(x)` exporting HTTP method functions.
    if (path.basename(file).startsWith('route.') && NEXT_ROUTE_EXPORT_RE.test(content)) {
      restEvidence.push(rel);
      continue;
    }

    if (REST_HANDLER_RE.test(content)) {
      restEvidence.push(rel);
    }

    // GraphQL schema / resolver heuristic.
    if (
      /\b(?:typeDefs|gql)\s*[=:]\s*(?:`|graphql`)/.test(content) ||
      /from\s+["']@apollo\/server["']/.test(content)
    ) {
      graphqlEvidence.push(rel);
    }
  }

  // Dependency-level GraphQL scan.
  const { deps } = collectAllDeps(cwd);
  for (const dep of deps) {
    if (GRAPHQL_DEPS.has(dep)) {
      graphqlEvidence.push(`dependency: ${dep}`);
    }
  }

  if (restEvidence.length > 0 && graphqlEvidence.length === 0) {
    return {
      id: 'rest-endpoints',
      title: 'Endpoints are REST',
      passed: true,
      message: `REST handlers detected in ${restEvidence.length} file(s).`,
      evidence: restEvidence.slice(0, 10),
    };
  }

  if (restEvidence.length > 0 && graphqlEvidence.length > 0) {
    return {
      id: 'rest-endpoints',
      title: 'Endpoints are REST',
      passed: true,
      warning: true,
      message:
        'REST handlers found, but GraphQL artifacts also present. Prefer REST per MESA architecture; remove GraphQL if not needed.',
      evidence: [...restEvidence.slice(0, 5), '— graphql —', ...graphqlEvidence.slice(0, 5)],
    };
  }

  if (graphqlEvidence.length > 0) {
    return {
      id: 'rest-endpoints',
      title: 'Endpoints are REST',
      passed: false,
      message: 'No REST handlers detected, but GraphQL artifacts found. Convert endpoints to REST.',
      evidence: graphqlEvidence.slice(0, 10),
    };
  }

  return {
    id: 'rest-endpoints',
    title: 'Endpoints are REST',
    passed: false,
    message:
      'No HTTP route handlers detected (Hono/Express app.<method>(...) or Next.js route.ts exports).',
  };
};
