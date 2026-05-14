import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';
import chalk from 'chalk';

// Root templates
import { render as renderRootPackageJson } from '../templates/prototype/root/package-json';
import { render as renderPnpmWorkspace } from '../templates/prototype/root/pnpm-workspace';
import { render as renderGitignore } from '../templates/prototype/root/gitignore';
import { render as renderEnvExample } from '../templates/prototype/root/env-example';
import { render as renderReadme } from '../templates/prototype/root/readme';
import {
  renderRoot as renderRootClaudeMd,
  renderProject as renderProjectClaudeMd,
} from '../templates/prototype/root/claude-md';

// Web (Next.js)
import { render as renderWebPackageJson } from '../templates/prototype/web/package-json';
import { render as renderWebNextConfig } from '../templates/prototype/web/next-config';
import { render as renderWebTsconfig } from '../templates/prototype/web/tsconfig';
import { render as renderWebPostcss } from '../templates/prototype/web/postcss-config';
import { render as renderWebGlobalsCss } from '../templates/prototype/web/globals-css';
import { render as renderWebLayout } from '../templates/prototype/web/layout-tsx';
import { render as renderWebPage } from '../templates/prototype/web/page-tsx';
import { render as renderWebApiRoute } from '../templates/prototype/web/api-route';
import { render as renderWebNextEnv } from '../templates/prototype/web/next-env';

// API (Hono)
import { render as renderApiPackageJson } from '../templates/prototype/api/package-json';
import { render as renderApiTsconfig } from '../templates/prototype/api/tsconfig';
import { render as renderApiEnv } from '../templates/prototype/api/env';
import { render as renderApiServer } from '../templates/prototype/api/server';
import { render as renderApiApp } from '../templates/prototype/api/app';
import { render as renderApiHealth } from '../templates/prototype/api/routes-health';
import { render as renderApiAuth } from '../templates/prototype/api/routes-auth';
import { render as renderApiMe } from '../templates/prototype/api/routes-me';
import { render as renderApiUploads } from '../templates/prototype/api/routes-uploads';
import { render as renderApiAuthMw } from '../templates/prototype/api/middleware-auth';
import { render as renderApiStorage } from '../templates/prototype/api/storage';

// DB (Drizzle + Neon)
import { render as renderDbPackageJson } from '../templates/prototype/db/package-json';
import { render as renderDbTsconfig } from '../templates/prototype/db/tsconfig';
import { render as renderDbSchema } from '../templates/prototype/db/schema';
import { render as renderDbClient } from '../templates/prototype/db/client';
import { render as renderDbIndex } from '../templates/prototype/db/index-ts';
import { render as renderDbDrizzleConfig } from '../templates/prototype/db/drizzle-config';

// CI + Vercel
import { render as renderCiYml } from '../templates/prototype/ci/ci-yml';
import { render as renderDeployYml } from '../templates/prototype/ci/deploy-yml';
import { render as renderVercelJson } from '../templates/prototype/vercel-json';

// Cursor rules + Claude skills (shared with `mesa init`)
import {
  renderWebArchitectureRule,
  renderSecurityRule,
  renderTestingRule,
} from '../templates/shared/cursor-rules';
import {
  renderArchitectureAuditSkill,
  renderRestApiDesignSkill,
  renderSecretsManagementSkill,
  renderVercelNeonDeploymentSkill,
} from '../templates/shared/claude-skills';

export interface PrototypeConfig {
  name: string;
  className: string;
  description: string;
  author: string;
  outputDir: string;
}

interface FileEntry {
  relativePath: string;
  content: string;
}

function buildManifest(config: PrototypeConfig): FileEntry[] {
  const files: FileEntry[] = [];

  // --- Root ---
  files.push({ relativePath: 'package.json', content: renderRootPackageJson(config) });
  files.push({ relativePath: 'pnpm-workspace.yaml', content: renderPnpmWorkspace(config) });
  files.push({ relativePath: '.gitignore', content: renderGitignore(config) });
  files.push({ relativePath: '.env.example', content: renderEnvExample(config) });
  files.push({ relativePath: 'README.md', content: renderReadme(config) });
  files.push({ relativePath: 'CLAUDE.md', content: renderRootClaudeMd(config) });
  files.push({ relativePath: '.claude/CLAUDE.md', content: renderProjectClaudeMd(config) });
  files.push({ relativePath: 'vercel.json', content: renderVercelJson(config) });

  // --- Cursor rules ---
  files.push({
    relativePath: '.cursor/rules/web-architecture.mdc',
    content: renderWebArchitectureRule(),
  });
  files.push({ relativePath: '.cursor/rules/security.mdc', content: renderSecurityRule() });
  files.push({ relativePath: '.cursor/rules/testing.mdc', content: renderTestingRule() });

  // --- Claude skills ---
  files.push({
    relativePath: '.claude/skills/architecture-audit.md',
    content: renderArchitectureAuditSkill(),
  });
  files.push({
    relativePath: '.claude/skills/rest-api-design.md',
    content: renderRestApiDesignSkill(),
  });
  files.push({
    relativePath: '.claude/skills/secrets-management.md',
    content: renderSecretsManagementSkill(),
  });
  files.push({
    relativePath: '.claude/skills/vercel-neon-deployment.md',
    content: renderVercelNeonDeploymentSkill(),
  });

  // --- CI ---
  files.push({ relativePath: '.github/workflows/ci.yml', content: renderCiYml(config) });
  files.push({ relativePath: '.github/workflows/deploy.yml', content: renderDeployYml(config) });

  // --- apps/web ---
  files.push({ relativePath: 'apps/web/package.json', content: renderWebPackageJson(config) });
  files.push({ relativePath: 'apps/web/next.config.ts', content: renderWebNextConfig(config) });
  files.push({ relativePath: 'apps/web/tsconfig.json', content: renderWebTsconfig(config) });
  files.push({ relativePath: 'apps/web/postcss.config.mjs', content: renderWebPostcss(config) });
  files.push({ relativePath: 'apps/web/next-env.d.ts', content: renderWebNextEnv(config) });
  files.push({
    relativePath: 'apps/web/src/app/globals.css',
    content: renderWebGlobalsCss(config),
  });
  files.push({ relativePath: 'apps/web/src/app/layout.tsx', content: renderWebLayout(config) });
  files.push({ relativePath: 'apps/web/src/app/page.tsx', content: renderWebPage(config) });
  files.push({
    relativePath: 'apps/web/src/app/api/[...route]/route.ts',
    content: renderWebApiRoute(config),
  });

  // --- apps/api ---
  files.push({ relativePath: 'apps/api/package.json', content: renderApiPackageJson(config) });
  files.push({ relativePath: 'apps/api/tsconfig.json', content: renderApiTsconfig(config) });
  files.push({ relativePath: 'apps/api/src/env.ts', content: renderApiEnv(config) });
  files.push({ relativePath: 'apps/api/src/server.ts', content: renderApiServer(config) });
  files.push({ relativePath: 'apps/api/src/app.ts', content: renderApiApp(config) });
  files.push({ relativePath: 'apps/api/src/routes/health.ts', content: renderApiHealth(config) });
  files.push({ relativePath: 'apps/api/src/routes/auth.ts', content: renderApiAuth(config) });
  files.push({ relativePath: 'apps/api/src/routes/me.ts', content: renderApiMe(config) });
  files.push({
    relativePath: 'apps/api/src/routes/uploads.ts',
    content: renderApiUploads(config),
  });
  files.push({
    relativePath: 'apps/api/src/middleware/auth.ts',
    content: renderApiAuthMw(config),
  });
  files.push({ relativePath: 'apps/api/src/lib/storage.ts', content: renderApiStorage(config) });

  // --- packages/db ---
  files.push({ relativePath: 'packages/db/package.json', content: renderDbPackageJson(config) });
  files.push({ relativePath: 'packages/db/tsconfig.json', content: renderDbTsconfig(config) });
  files.push({
    relativePath: 'packages/db/drizzle.config.ts',
    content: renderDbDrizzleConfig(config),
  });
  files.push({ relativePath: 'packages/db/src/schema.ts', content: renderDbSchema(config) });
  files.push({ relativePath: 'packages/db/src/client.ts', content: renderDbClient(config) });
  files.push({ relativePath: 'packages/db/src/index.ts', content: renderDbIndex(config) });

  return files;
}

export async function scaffoldPrototype(config: PrototypeConfig): Promise<void> {
  const { outputDir, name } = config;

  console.log(chalk.blue(`\nScaffolding prototype ${chalk.bold(name)}...\n`));

  const files = buildManifest(config);

  // Create directories.
  const dirs = new Set<string>();
  for (const file of files) {
    const dir = path.dirname(path.join(outputDir, file.relativePath));
    let cur = dir;
    while (cur !== outputDir && cur.startsWith(outputDir)) {
      dirs.add(cur);
      cur = path.dirname(cur);
    }
  }
  dirs.add(outputDir);
  const sortedDirs = [...dirs].sort();
  for (const dir of sortedDirs) {
    await mkdir(dir, { recursive: true });
  }

  // Write files.
  for (const file of files) {
    const filePath = path.join(outputDir, file.relativePath);
    await writeFile(filePath, file.content, 'utf8');
    console.log(chalk.green('  ✓ ') + chalk.dim(file.relativePath));
  }

  // Initialize git.
  console.log(chalk.blue('\nInitializing git repository...'));
  try {
    execSync('git init', { cwd: outputDir, stdio: 'pipe' });
    execSync('git add .', { cwd: outputDir, stdio: 'pipe' });
    execSync('git commit -m "✨ Initial scaffold via mesa prototype"', {
      cwd: outputDir,
      stdio: 'pipe',
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: config.author || 'mesa-cli',
        GIT_COMMITTER_NAME: config.author || 'mesa-cli',
      },
    });
    console.log(chalk.green('  ✓ ') + 'Git repository initialized with initial commit');
  } catch {
    console.log(chalk.yellow('  ⚠ ') + 'Git initialization failed (git may not be installed)');
  }

  console.log(
    chalk.green(`\n✓ Prototype ${chalk.bold(name)} created with ${files.length} files\n`)
  );
}
