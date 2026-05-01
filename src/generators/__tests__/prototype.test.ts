import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { scaffoldPrototype } from '../prototype-scaffold';
import { runChecks } from '../../util/verify';

function makeTmpDir(): string {
  return join(tmpdir(), `mesa-proto-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
  dirs.length = 0;
});

describe('prototype scaffold', () => {
  it('creates the full pnpm monorepo layout', async () => {
    const outputDir = makeTmpDir();
    dirs.push(outputDir);

    await scaffoldPrototype({
      name: 'my-proto',
      className: 'MyProto',
      description: 'test prototype',
      author: 'tester',
      outputDir,
    });

    // Root.
    expect(existsSync(join(outputDir, 'package.json'))).toBe(true);
    expect(existsSync(join(outputDir, 'pnpm-workspace.yaml'))).toBe(true);
    expect(existsSync(join(outputDir, '.gitignore'))).toBe(true);
    expect(existsSync(join(outputDir, '.env.example'))).toBe(true);
    expect(existsSync(join(outputDir, 'vercel.json'))).toBe(true);
    expect(existsSync(join(outputDir, 'CLAUDE.md'))).toBe(true);
    expect(existsSync(join(outputDir, '.claude/CLAUDE.md'))).toBe(true);

    // Cursor rules + skills.
    expect(existsSync(join(outputDir, '.cursor/rules/web-architecture.mdc'))).toBe(true);
    expect(existsSync(join(outputDir, '.cursor/rules/security.mdc'))).toBe(true);
    expect(existsSync(join(outputDir, '.cursor/rules/testing.mdc'))).toBe(true);
    expect(existsSync(join(outputDir, '.claude/skills/architecture-audit.md'))).toBe(true);
    expect(existsSync(join(outputDir, '.claude/skills/rest-api-design.md'))).toBe(true);
    expect(existsSync(join(outputDir, '.claude/skills/secrets-management.md'))).toBe(true);
    expect(existsSync(join(outputDir, '.claude/skills/vercel-neon-deployment.md'))).toBe(true);

    // CI workflows.
    expect(existsSync(join(outputDir, '.github/workflows/ci.yml'))).toBe(true);
    expect(existsSync(join(outputDir, '.github/workflows/deploy.yml'))).toBe(true);

    // Web (Next.js).
    expect(existsSync(join(outputDir, 'apps/web/package.json'))).toBe(true);
    expect(existsSync(join(outputDir, 'apps/web/src/app/page.tsx'))).toBe(true);
    expect(existsSync(join(outputDir, 'apps/web/src/app/layout.tsx'))).toBe(true);
    expect(existsSync(join(outputDir, 'apps/web/src/app/api/[...route]/route.ts'))).toBe(true);

    // API (Hono).
    expect(existsSync(join(outputDir, 'apps/api/package.json'))).toBe(true);
    expect(existsSync(join(outputDir, 'apps/api/src/app.ts'))).toBe(true);
    expect(existsSync(join(outputDir, 'apps/api/src/server.ts'))).toBe(true);
    expect(existsSync(join(outputDir, 'apps/api/src/env.ts'))).toBe(true);
    expect(existsSync(join(outputDir, 'apps/api/src/routes/auth.ts'))).toBe(true);
    expect(existsSync(join(outputDir, 'apps/api/src/routes/health.ts'))).toBe(true);
    expect(existsSync(join(outputDir, 'apps/api/src/routes/me.ts'))).toBe(true);
    expect(existsSync(join(outputDir, 'apps/api/src/routes/uploads.ts'))).toBe(true);
    expect(existsSync(join(outputDir, 'apps/api/src/middleware/auth.ts'))).toBe(true);
    expect(existsSync(join(outputDir, 'apps/api/src/lib/storage.ts'))).toBe(true);

    // DB (Drizzle + Neon).
    expect(existsSync(join(outputDir, 'packages/db/package.json'))).toBe(true);
    expect(existsSync(join(outputDir, 'packages/db/src/schema.ts'))).toBe(true);
    expect(existsSync(join(outputDir, 'packages/db/src/client.ts'))).toBe(true);
    expect(existsSync(join(outputDir, 'packages/db/drizzle.config.ts'))).toBe(true);
  });

  it('deploy.yml uses workflow_dispatch only (no push/PR triggers)', async () => {
    const outputDir = makeTmpDir();
    dirs.push(outputDir);

    await scaffoldPrototype({
      name: 'my-proto',
      className: 'MyProto',
      description: 'test',
      author: 'tester',
      outputDir,
    });

    const deployYml = readFileSync(join(outputDir, '.github/workflows/deploy.yml'), 'utf8');
    expect(deployYml).toContain('workflow_dispatch');
    expect(deployYml).not.toMatch(/^on:\s*\n\s*push:/m);
    expect(deployYml).not.toMatch(/^on:\s*\n\s*pull_request:/m);
    expect(deployYml).toContain('environment: preview');
    expect(deployYml).toContain('environment: production');
  });

  it('schema.ts has users table with passwordHash', async () => {
    const outputDir = makeTmpDir();
    dirs.push(outputDir);

    await scaffoldPrototype({
      name: 'my-proto',
      className: 'MyProto',
      description: 'test',
      author: 'tester',
      outputDir,
    });

    const schema = readFileSync(join(outputDir, 'packages/db/src/schema.ts'), 'utf8');
    expect(schema).toContain('users');
    expect(schema).toContain('passwordHash');
  });

  it('passes all 5 mesa verify checks', async () => {
    const outputDir = makeTmpDir();
    dirs.push(outputDir);

    await scaffoldPrototype({
      name: 'my-proto',
      className: 'MyProto',
      description: 'test',
      author: 'tester',
      outputDir,
    });

    const results = await runChecks(outputDir);
    const failed = results.filter(r => !r.passed && !r.warning);
    expect(failed.map(r => `${r.id}: ${r.message}`)).toEqual([]);
    expect(results.every(r => r.passed)).toBe(true);
  });
});
