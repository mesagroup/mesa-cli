import { describe, it, expect, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runChecks } from '../index';

function makeTmp(): string {
  const dir = join(tmpdir(), `verify-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

const cleanup: string[] = [];
afterEach(() => {
  for (const dir of cleanup) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
  cleanup.length = 0;
});

function write(dir: string, rel: string, content: string): void {
  const full = join(dir, rel);
  mkdirSync(join(full, '..'), { recursive: true });
  writeFileSync(full, content, 'utf8');
}

function findCheck(results: Awaited<ReturnType<typeof runChecks>>, id: string) {
  return results.find(r => r.id === id)!;
}

describe('verify checks', () => {
  describe('not-sqlite', () => {
    it('passes on a clean Postgres project', async () => {
      const dir = makeTmp();
      cleanup.push(dir);
      write(
        dir,
        'package.json',
        JSON.stringify({
          name: 'x',
          dependencies: { '@neondatabase/serverless': '^0.10.0', 'drizzle-orm': '^0.36.0' },
        })
      );

      const results = await runChecks(dir);
      const check = findCheck(results, 'not-sqlite');
      expect(check.passed).toBe(true);
    });

    it('fails on better-sqlite3 dep', async () => {
      const dir = makeTmp();
      cleanup.push(dir);
      write(
        dir,
        'package.json',
        JSON.stringify({ name: 'x', dependencies: { 'better-sqlite3': '^11.0.0' } })
      );

      const results = await runChecks(dir);
      const check = findCheck(results, 'not-sqlite');
      expect(check.passed).toBe(false);
      expect(check.evidence?.join(' ')).toContain('better-sqlite3');
    });

    it('fails on sqlite:// connection string in .env', async () => {
      const dir = makeTmp();
      cleanup.push(dir);
      write(dir, 'package.json', JSON.stringify({ name: 'x' }));
      write(dir, '.env.example', 'DATABASE_URL=sqlite:///tmp/foo.db\n');

      const results = await runChecks(dir);
      const check = findCheck(results, 'not-sqlite');
      expect(check.passed).toBe(false);
    });
  });

  describe('rest-endpoints', () => {
    it('passes when Hono routes are present', async () => {
      const dir = makeTmp();
      cleanup.push(dir);
      write(dir, 'package.json', JSON.stringify({ name: 'x', dependencies: { hono: '^4' } }));
      write(
        dir,
        'src/routes.ts',
        `import { Hono } from 'hono';\nexport const app = new Hono();\napp.get('/health', (c) => c.json({}));\n`
      );

      const results = await runChecks(dir);
      const check = findCheck(results, 'rest-endpoints');
      expect(check.passed).toBe(true);
    });

    it('passes when Next.js route.ts exports HTTP methods', async () => {
      const dir = makeTmp();
      cleanup.push(dir);
      write(dir, 'package.json', JSON.stringify({ name: 'x' }));
      write(
        dir,
        'app/api/x/route.ts',
        `export async function GET() { return new Response('ok'); }\n`
      );

      const results = await runChecks(dir);
      const check = findCheck(results, 'rest-endpoints');
      expect(check.passed).toBe(true);
    });

    it('fails when only GraphQL is present', async () => {
      const dir = makeTmp();
      cleanup.push(dir);
      write(
        dir,
        'package.json',
        JSON.stringify({
          name: 'x',
          dependencies: { '@apollo/server': '^4', graphql: '^16' },
        })
      );
      write(dir, 'src/server.ts', `import { ApolloServer } from '@apollo/server';\n`);

      const results = await runChecks(dir);
      const check = findCheck(results, 'rest-endpoints');
      expect(check.passed).toBe(false);
    });
  });

  describe('auth-username-password', () => {
    it('passes with bcrypt + login route', async () => {
      const dir = makeTmp();
      cleanup.push(dir);
      write(dir, 'package.json', JSON.stringify({ name: 'x', dependencies: { bcryptjs: '^2' } }));
      write(
        dir,
        'src/auth.ts',
        `import bcrypt from 'bcryptjs';\nasync function login(username: string, password: string) {\n  return bcrypt.compare(password, '...');\n}`
      );

      const results = await runChecks(dir);
      const check = findCheck(results, 'auth-username-password');
      expect(check.passed).toBe(true);
    });

    it('fails without a hashing dependency', async () => {
      const dir = makeTmp();
      cleanup.push(dir);
      write(dir, 'package.json', JSON.stringify({ name: 'x' }));
      write(dir, 'src/auth.ts', 'const password = "x"; const username = "y";\n');

      const results = await runChecks(dir);
      const check = findCheck(results, 'auth-username-password');
      expect(check.passed).toBe(false);
    });
  });

  describe('vercel-blob-storage', () => {
    it('passes when @vercel/blob is in deps', async () => {
      const dir = makeTmp();
      cleanup.push(dir);
      write(
        dir,
        'package.json',
        JSON.stringify({ name: 'x', dependencies: { '@vercel/blob': '^0.27.0' } })
      );

      const results = await runChecks(dir);
      const check = findCheck(results, 'vercel-blob-storage');
      expect(check.passed).toBe(true);
    });

    it('passes when BLOB_READ_WRITE_TOKEN appears in env', async () => {
      const dir = makeTmp();
      cleanup.push(dir);
      write(dir, 'package.json', JSON.stringify({ name: 'x' }));
      write(dir, '.env.example', 'BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...\n');

      const results = await runChecks(dir);
      const check = findCheck(results, 'vercel-blob-storage');
      expect(check.passed).toBe(true);
    });

    it('fails on a project with no blob references', async () => {
      const dir = makeTmp();
      cleanup.push(dir);
      write(dir, 'package.json', JSON.stringify({ name: 'x' }));

      const results = await runChecks(dir);
      const check = findCheck(results, 'vercel-blob-storage');
      expect(check.passed).toBe(false);
    });
  });

  describe('environments-prod-preview', () => {
    it('passes when both environments declared in workflow', async () => {
      const dir = makeTmp();
      cleanup.push(dir);
      write(dir, 'package.json', JSON.stringify({ name: 'x' }));
      write(
        dir,
        '.github/workflows/deploy.yml',
        `name: Deploy\non: workflow_dispatch\njobs:\n  preview:\n    environment: preview\n  prod:\n    environment: production\n`
      );

      const results = await runChecks(dir);
      const check = findCheck(results, 'environments-prod-preview');
      expect(check.passed).toBe(true);
    });

    it('fails when only one environment declared', async () => {
      const dir = makeTmp();
      cleanup.push(dir);
      write(dir, 'package.json', JSON.stringify({ name: 'x' }));
      write(
        dir,
        '.github/workflows/deploy.yml',
        `jobs:\n  prod:\n    environment: production\n`
      );

      const results = await runChecks(dir);
      const check = findCheck(results, 'environments-prod-preview');
      expect(check.passed).toBe(false);
      expect(check.message).toContain('preview');
    });
  });

  describe('runChecks composite', () => {
    it('returns all 5 checks', async () => {
      const dir = makeTmp();
      cleanup.push(dir);
      write(dir, 'package.json', JSON.stringify({ name: 'x' }));
      const results = await runChecks(dir);
      expect(results).toHaveLength(5);
      const ids = results.map(r => r.id).sort();
      expect(ids).toEqual([
        'auth-username-password',
        'environments-prod-preview',
        'not-sqlite',
        'rest-endpoints',
        'vercel-blob-storage',
      ]);
    });
  });
});
