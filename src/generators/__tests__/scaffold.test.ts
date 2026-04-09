import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { scaffold } from '../scaffold';
import type { ScaffoldConfig } from '../../types/scaffold';

// Skip npm install + aspire add during tests
beforeAll(() => {
  process.env.MESA_SKIP_INSTALL = '1';
});

function makeTmpDir(): string {
  const dir = join(tmpdir(), `mesa-test-${Date.now()}`);
  return dir;
}

function makeConfig(overrides: Partial<ScaffoldConfig> = {}): ScaffoldConfig {
  const outputDir = makeTmpDir();
  return {
    projectType: 'onprem',
    pluginName: 'test-plugin',
    pluginClassName: 'TestPlugin',
    description: 'Test description',
    author: 'Test Author',
    includeFrontend: false,
    outputDir,
    ...overrides,
  };
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

describe('scaffold', () => {
  it('creates backend-only project', async () => {
    const config = makeConfig({ includeFrontend: false });
    dirs.push(config.outputDir);

    await scaffold(config);

    // Core files exist
    expect(existsSync(join(config.outputDir, 'package.json'))).toBe(true);
    expect(existsSync(join(config.outputDir, '.gitignore'))).toBe(true);
    expect(existsSync(join(config.outputDir, 'CLAUDE.md'))).toBe(true);
    expect(existsSync(join(config.outputDir, '.claude/CLAUDE.md'))).toBe(true);
    expect(existsSync(join(config.outputDir, 'apphost.ts'))).toBe(true);

    // Backend files
    expect(existsSync(join(config.outputDir, 'backend/src/server.ts'))).toBe(true);
    expect(existsSync(join(config.outputDir, 'backend/src/middleware/authJwt.ts'))).toBe(true);
    expect(existsSync(join(config.outputDir, 'backend/src/services/db.ts'))).toBe(true);
    expect(existsSync(join(config.outputDir, 'backend/src/routes/health.ts'))).toBe(true);
    expect(existsSync(join(config.outputDir, 'backend/src/config/env.ts'))).toBe(true);

    // No frontend
    expect(existsSync(join(config.outputDir, 'frontend'))).toBe(false);
  });

  it('creates project with frontend', async () => {
    const config = makeConfig({ includeFrontend: true });
    dirs.push(config.outputDir);

    await scaffold(config);

    // Frontend files
    expect(existsSync(join(config.outputDir, 'frontend/package.json'))).toBe(true);
    expect(existsSync(join(config.outputDir, 'frontend/angular.json'))).toBe(true);
    expect(existsSync(join(config.outputDir, 'frontend/webpack.config.js'))).toBe(true);
    expect(existsSync(join(config.outputDir, `frontend/projects/test-plugin/src/public-api.ts`))).toBe(true);
    expect(existsSync(join(config.outputDir, `frontend/projects/test-plugin/src/lib/test-plugin.module.ts`))).toBe(true);
  });

  it('initializes git repo', async () => {
    const config = makeConfig();
    dirs.push(config.outputDir);

    await scaffold(config);

    expect(existsSync(join(config.outputDir, '.git'))).toBe(true);
    const log = execSync('git log --oneline', { cwd: config.outputDir, encoding: 'utf8' });
    expect(log).toContain('Initial scaffold via mesa-cli');
  });

  it('.gitignore contains required entries', async () => {
    const config = makeConfig();
    dirs.push(config.outputDir);

    await scaffold(config);

    const gitignore = readFileSync(join(config.outputDir, '.gitignore'), 'utf8');
    expect(gitignore).toContain('.env');
    expect(gitignore).toContain('node_modules');
    expect(gitignore).toContain('dist');
    expect(gitignore).toContain('.modules');
  });

  it('no secrets in generated files', async () => {
    const config = makeConfig({ includeFrontend: true });
    dirs.push(config.outputDir);

    await scaffold(config);

    // Check that no real secrets are in tracked files (env.example has placeholders)
    const serverTs = readFileSync(join(config.outputDir, 'backend/src/server.ts'), 'utf8');
    expect(serverTs).not.toContain('YourStr0ngP@ssword');

    const envConfig = readFileSync(join(config.outputDir, 'backend/src/config/env.ts'), 'utf8');
    expect(envConfig).not.toContain('YourStr0ngP@ssword');
  });

  it('CLAUDE.md contains MESAPPA rules', async () => {
    const config = makeConfig();
    dirs.push(config.outputDir);

    await scaffold(config);

    const claudeMd = readFileSync(join(config.outputDir, '.claude/CLAUDE.md'), 'utf8');
    expect(claudeMd).toContain('parameterized');
    expect(claudeMd).toContain('SQL');
    expect(claudeMd).toContain('JWT');
    expect(claudeMd).toContain('CORS');
  });

  it('apphost.ts omits frontend when not included', async () => {
    const config = makeConfig({ includeFrontend: false });
    dirs.push(config.outputDir);

    await scaffold(config);

    const apphost = readFileSync(join(config.outputDir, 'apphost.ts'), 'utf8');
    expect(apphost).toContain('addNodeApp');
    expect(apphost).not.toContain('addJavaScriptApp');
  });

  it('apphost.ts includes frontend when included', async () => {
    const config = makeConfig({ includeFrontend: true });
    dirs.push(config.outputDir);

    await scaffold(config);

    const apphost = readFileSync(join(config.outputDir, 'apphost.ts'), 'utf8');
    expect(apphost).toContain('addNodeApp');
    expect(apphost).toContain('addJavaScriptApp');
  });

  // --- Standalone project type tests ---

  it('standalone default: Next.js full-stack + SQL Server', async () => {
    const config = makeConfig({ projectType: 'standalone', frontend: 'nextjs', database: 'sqlserver' });
    dirs.push(config.outputDir);

    await scaffold(config);

    // Next.js full-stack files at root (no backend/ or frontend/)
    expect(existsSync(join(config.outputDir, 'package.json'))).toBe(true);
    expect(existsSync(join(config.outputDir, 'next.config.ts'))).toBe(true);
    expect(existsSync(join(config.outputDir, 'src/app/layout.tsx'))).toBe(true);
    expect(existsSync(join(config.outputDir, 'src/app/page.tsx'))).toBe(true);
    expect(existsSync(join(config.outputDir, 'src/app/api/health/route.ts'))).toBe(true);
    expect(existsSync(join(config.outputDir, 'src/lib/db.ts'))).toBe(true);
    expect(existsSync(join(config.outputDir, 'src/lib/env.ts'))).toBe(true);

    // Aspire for local orchestration
    expect(existsSync(join(config.outputDir, 'apphost.ts'))).toBe(true);

    // CI
    expect(existsSync(join(config.outputDir, '.github/workflows/ci.yml'))).toBe(true);

    // No separate backend or frontend dirs
    expect(existsSync(join(config.outputDir, 'backend'))).toBe(false);
    expect(existsSync(join(config.outputDir, 'frontend'))).toBe(false);
  });

  it('standalone with Angular + PostgreSQL creates monorepo', async () => {
    const config = makeConfig({ projectType: 'standalone', frontend: 'angular', database: 'postgresql' });
    dirs.push(config.outputDir);

    await scaffold(config);

    // Express backend
    expect(existsSync(join(config.outputDir, 'backend/src/server.ts'))).toBe(true);
    expect(existsSync(join(config.outputDir, 'backend/src/services/db.ts'))).toBe(true);

    // Angular frontend
    expect(existsSync(join(config.outputDir, 'frontend/angular.json'))).toBe(true);

    // Root workspace package.json
    const rootPkg = JSON.parse(readFileSync(join(config.outputDir, 'package.json'), 'utf8'));
    expect(rootPkg.scripts['install:all']).toBeDefined();
  });

  it('standalone with React+Vite creates monorepo', async () => {
    const config = makeConfig({ projectType: 'standalone', frontend: 'react-vite', database: 'sqlserver' });
    dirs.push(config.outputDir);

    await scaffold(config);

    // Express backend
    expect(existsSync(join(config.outputDir, 'backend/src/server.ts'))).toBe(true);

    // Vite frontend
    expect(existsSync(join(config.outputDir, 'frontend/vite.config.ts'))).toBe(true);
    expect(existsSync(join(config.outputDir, 'frontend/src/App.tsx'))).toBe(true);

    // No Angular
    expect(existsSync(join(config.outputDir, 'frontend/angular.json'))).toBe(false);
  });

  it('standalone .gitignore contains Aspire and Next.js entries', async () => {
    const config = makeConfig({ projectType: 'standalone', frontend: 'nextjs', database: 'sqlserver' });
    dirs.push(config.outputDir);

    await scaffold(config);

    const gitignore = readFileSync(join(config.outputDir, '.gitignore'), 'utf8');
    expect(gitignore).toContain('.modules');
    expect(gitignore).toContain('.next');
    expect(gitignore).not.toContain('local.settings.json');
  });

  it('standalone CLAUDE.md contains rules', async () => {
    const config = makeConfig({ projectType: 'standalone', frontend: 'nextjs', database: 'sqlserver' });
    dirs.push(config.outputDir);

    await scaffold(config);

    const claudeMd = readFileSync(join(config.outputDir, '.claude/CLAUDE.md'), 'utf8');
    expect(claudeMd).toContain('Standalone');
    expect(claudeMd).toContain('parameterized');
    expect(claudeMd).toContain('JWT');
    expect(claudeMd).toContain('CORS');
    expect(claudeMd).not.toContain('Azure Functions');
    expect(claudeMd).toContain('not a MESAPPA plugin');
  });

  it('standalone includes GitHub Actions CI', async () => {
    const config = makeConfig({ projectType: 'standalone', frontend: 'nextjs', database: 'sqlserver' });
    dirs.push(config.outputDir);

    await scaffold(config);

    expect(existsSync(join(config.outputDir, '.github/workflows/ci.yml'))).toBe(true);
  });

  it('standalone vercel deploy generates Vercel CI', async () => {
    const config = makeConfig({ projectType: 'standalone', frontend: 'nextjs', database: 'sqlserver', deployTarget: 'vercel' });
    dirs.push(config.outputDir);

    await scaffold(config);

    const ci = readFileSync(join(config.outputDir, '.github/workflows/ci.yml'), 'utf8');
    expect(ci).toContain('VERCEL_TOKEN');
    expect(ci).not.toContain('azd');
  });

  it('standalone azure deploy generates Azure CI', async () => {
    const config = makeConfig({ projectType: 'standalone', frontend: 'nextjs', database: 'sqlserver', deployTarget: 'azure' });
    dirs.push(config.outputDir);

    await scaffold(config);

    const ci = readFileSync(join(config.outputDir, '.github/workflows/ci.yml'), 'utf8');
    expect(ci).toContain('azd');
    expect(ci).not.toContain('VERCEL_TOKEN');
  });

  it('standalone MongoDB Atlas skips Aspire', async () => {
    const config = makeConfig({ projectType: 'standalone', frontend: 'nextjs', database: 'mongodb', mongoMode: 'atlas' });
    dirs.push(config.outputDir);

    await scaffold(config);

    // No Aspire files when using Atlas
    expect(existsSync(join(config.outputDir, 'apphost.ts'))).toBe(false);
    expect(existsSync(join(config.outputDir, 'scripts'))).toBe(false);

    // Still has Next.js app
    expect(existsSync(join(config.outputDir, 'src/app/page.tsx'))).toBe(true);
  });
});
