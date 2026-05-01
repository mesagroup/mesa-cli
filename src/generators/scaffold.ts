import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';
import chalk from 'chalk';
import type { ScaffoldConfig } from '../types/scaffold';

// Backend templates (on-prem)
import { render as renderBackendPackageJson } from '../templates/backend/package-json';
import { render as renderBackendTsconfig } from '../templates/backend/tsconfig';
import { render as renderServer } from '../templates/backend/server';
import { render as renderHealthRoute } from '../templates/backend/health-route';
import { render as renderRoutesIndex } from '../templates/backend/routes-index';
import { render as renderDbService } from '../templates/backend/db-service';
import { render as renderAuthJwt } from '../templates/backend/auth-jwt';
import { render as renderEnvConfig } from '../templates/backend/env-config';
import { render as renderBackendEnvExample } from '../templates/backend/env-example';
import { render as renderNodemon } from '../templates/backend/nodemon';

// Backend templates (SaaS — Azure Functions)
import { render as renderSaasPackageJson } from '../templates/backend-saas/package-json';
import { render as renderSaasTsconfig } from '../templates/backend-saas/tsconfig';
import { render as renderHostJson } from '../templates/backend-saas/host-json';
import { render as renderLocalSettingsExample } from '../templates/backend-saas/local-settings-example';
import { render as renderSaasHealthFunction } from '../templates/backend-saas/health-function';
import { render as renderSaasEnvConfig } from '../templates/backend-saas/env-config';
import { render as renderSaasDbService } from '../templates/backend-saas/db-service';
import { render as renderSaasAuthMiddleware } from '../templates/backend-saas/auth-middleware';
import { render as renderSaasSampleFunction } from '../templates/backend-saas/sample-function';

// Aspire templates (on-prem only)
import { render as renderAppHost } from '../templates/aspire/apphost';
import { render as renderAspireConfig } from '../templates/aspire/aspire-config';

// Root templates (shared, with conditional logic inside)
import { render as renderRootPackageJson } from '../templates/root/package-json';
import { render as renderGitignore } from '../templates/root/gitignore';
import { render as renderRootEnvExample } from '../templates/root/env-example';
import {
  renderRoot as renderRootClaudeMd,
  renderProject as renderProjectClaudeMd,
} from '../templates/root/claude-md';
import { render as renderReadme } from '../templates/root/readme';
import { render as renderEnvVarsDoc } from '../templates/root/env-vars-doc';

// Script templates (on-prem)
import { render as renderStartLocalPs1 } from '../templates/scripts/start-local-ps1';
import { render as renderStartLocalSh } from '../templates/scripts/start-local-sh';
import { render as renderDeployPs1 } from '../templates/scripts/deploy-ps1';

// Script templates (SaaS)
import { render as renderSaasStartLocalPs1 } from '../templates/scripts-saas/start-local-ps1';
import { render as renderSaasStartLocalSh } from '../templates/scripts-saas/start-local-sh';
import { render as renderSaasDeployPs1 } from '../templates/scripts-saas/deploy-ps1';

// CI templates
import { render as renderGitHubActions } from '../templates/ci/github-actions';
import { render as renderGitHubActionsStandalone } from '../templates/ci/github-actions-standalone';

// Database templates (standalone)
import * as sqlserverDb from '../templates/db/sqlserver';
import * as postgresqlDb from '../templates/db/postgresql';
import * as mongodbDb from '../templates/db/mongodb';

// Next.js full-stack templates (standalone — no separate backend)
import { render as renderNextjsPackageJson } from '../templates/nextjs/package-json';
import { render as renderNextjsConfig } from '../templates/nextjs/next-config';
import { render as renderNextjsTsconfig } from '../templates/nextjs/tsconfig';
import { render as renderNextjsPostcssConfig } from '../templates/nextjs/postcss-config';
import { render as renderNextjsLayout } from '../templates/nextjs/layout-tsx';
import { render as renderNextjsPage } from '../templates/nextjs/page-tsx';
import { render as renderNextjsGlobalsCss } from '../templates/nextjs/globals-css';
import { render as renderNextjsApiHealth } from '../templates/nextjs/api-health-route';
import { render as renderNextjsEnvConfig } from '../templates/nextjs/env-config';

// Next.js frontend templates (standalone — with separate Express backend)
import { render as renderNextFePackageJson } from '../templates/frontend-standalone/package-json';
import { render as renderNextFeConfig } from '../templates/frontend-standalone/next-config';
import { render as renderNextFeTsconfig } from '../templates/frontend-standalone/tsconfig';
import { render as renderNextFePostcssConfig } from '../templates/frontend-standalone/postcss-config';
import { render as renderNextFeLayout } from '../templates/frontend-standalone/layout-tsx';
import { render as renderNextFePage } from '../templates/frontend-standalone/page-tsx';
import { render as renderNextFeGlobalsCss } from '../templates/frontend-standalone/globals-css';

// React + Vite frontend templates (standalone)
import { render as renderVitePackageJson } from '../templates/frontend-vite/package-json';
import { render as renderViteConfig } from '../templates/frontend-vite/vite-config';
import { render as renderViteTsconfig } from '../templates/frontend-vite/tsconfig';
import { render as renderViteIndexHtml } from '../templates/frontend-vite/index-html';
import { render as renderViteAppTsx } from '../templates/frontend-vite/app-tsx';
import { render as renderViteMainTsx } from '../templates/frontend-vite/main-tsx';
import { render as renderViteIndexCss } from '../templates/frontend-vite/index-css';
import { render as renderViteTailwindConfig } from '../templates/frontend-vite/tailwind-config';
import { render as renderVitePostcssConfig } from '../templates/frontend-vite/postcss-config';

// Cursor rules + Claude skills (shared)
import {
  renderWebArchitectureRule,
  renderSecurityRule,
  renderTestingRule,
} from '../templates/shared/cursor-rules';
import {
  renderArchitectureAuditSkill,
  renderRestApiDesignSkill,
  renderSecretsManagementSkill,
} from '../templates/shared/claude-skills';

// Frontend templates (shared between on-prem and SaaS)
import { render as renderFrontendPackageJson } from '../templates/frontend/package-json';
import { render as renderAngularJson } from '../templates/frontend/angular-json';
import { render as renderFrontendTsconfig } from '../templates/frontend/tsconfig';
import { render as renderWebpackConfig } from '../templates/frontend/webpack-config';
import { render as renderProxyConf } from '../templates/frontend/proxy-conf';
import { render as renderPluginModule } from '../templates/frontend/plugin-module';
import { render as renderPluginComponent } from '../templates/frontend/plugin-component';
import { render as renderPluginService } from '../templates/frontend/plugin-service';
import { render as renderPublicApi } from '../templates/frontend/public-api';
import { render as renderModels } from '../templates/frontend/models';
import { render as renderDevAppModule } from '../templates/frontend/dev-app-module';
import { render as renderDevAppComponent } from '../templates/frontend/dev-app-component';

interface FileEntry {
  relativePath: string;
  content: string;
}

function addFrontendFiles(files: FileEntry[], config: ScaffoldConfig): void {
  const { pluginName } = config;
  files.push({ relativePath: 'frontend/package.json', content: renderFrontendPackageJson(config) });
  files.push({ relativePath: 'frontend/angular.json', content: renderAngularJson(config) });
  files.push({ relativePath: 'frontend/tsconfig.json', content: renderFrontendTsconfig(config) });
  files.push({ relativePath: 'frontend/webpack.config.js', content: renderWebpackConfig(config) });
  files.push({ relativePath: 'frontend/proxy.conf.js', content: renderProxyConf(config) });
  files.push({
    relativePath: `frontend/projects/${pluginName}/src/lib/${pluginName}.module.ts`,
    content: renderPluginModule(config),
  });
  files.push({
    relativePath: `frontend/projects/${pluginName}/src/lib/${pluginName}.component.ts`,
    content: renderPluginComponent(config),
  });
  files.push({
    relativePath: `frontend/projects/${pluginName}/src/lib/${pluginName}.service.ts`,
    content: renderPluginService(config),
  });
  files.push({
    relativePath: `frontend/projects/${pluginName}/src/lib/models.ts`,
    content: renderModels(config),
  });
  files.push({
    relativePath: `frontend/projects/${pluginName}/src/public-api.ts`,
    content: renderPublicApi(config),
  });
  files.push({
    relativePath: 'frontend/src/app/app.module.ts',
    content: renderDevAppModule(config),
  });
  files.push({
    relativePath: 'frontend/src/app/app.component.ts',
    content: renderDevAppComponent(config),
  });
}

function addRootFiles(files: FileEntry[], config: ScaffoldConfig): void {
  files.push({ relativePath: 'package.json', content: renderRootPackageJson(config) });
  files.push({ relativePath: '.gitignore', content: renderGitignore(config) });
  files.push({ relativePath: '.env.example', content: renderRootEnvExample(config) });
  files.push({ relativePath: 'CLAUDE.md', content: renderRootClaudeMd(config) });
  files.push({ relativePath: '.claude/CLAUDE.md', content: renderProjectClaudeMd(config) });
  files.push({ relativePath: 'docs/README.md', content: renderReadme(config) });
  files.push({ relativePath: 'docs/env-vars.md', content: renderEnvVarsDoc(config) });
  addRulesAndSkills(files);
}

/**
 * Add cursor rules and claude skills shared across all generated project types.
 * Called from both `addRootFiles` (monorepo / plugin layout) and the standalone
 * Next.js full-stack branch.
 */
function addRulesAndSkills(files: FileEntry[]): void {
  files.push({
    relativePath: '.cursor/rules/web-architecture.mdc',
    content: renderWebArchitectureRule(),
  });
  files.push({ relativePath: '.cursor/rules/security.mdc', content: renderSecurityRule() });
  files.push({ relativePath: '.cursor/rules/testing.mdc', content: renderTestingRule() });
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
}

function buildOnPremManifest(config: ScaffoldConfig): FileEntry[] {
  const files: FileEntry[] = [];

  addRootFiles(files, config);

  // Aspire
  files.push({ relativePath: 'apphost.ts', content: renderAppHost(config) });
  files.push({ relativePath: 'aspire.config.json', content: renderAspireConfig(config) });

  // Scripts
  files.push({ relativePath: 'scripts/start-local.ps1', content: renderStartLocalPs1(config) });
  files.push({ relativePath: 'scripts/start-local.sh', content: renderStartLocalSh(config) });
  files.push({ relativePath: 'scripts/deploy.ps1', content: renderDeployPs1(config) });

  // Backend
  files.push({ relativePath: 'backend/package.json', content: renderBackendPackageJson(config) });
  files.push({ relativePath: 'backend/tsconfig.json', content: renderBackendTsconfig(config) });
  files.push({ relativePath: 'backend/.env.example', content: renderBackendEnvExample(config) });
  files.push({ relativePath: 'backend/nodemon.json', content: renderNodemon(config) });
  files.push({ relativePath: 'backend/src/server.ts', content: renderServer(config) });
  files.push({ relativePath: 'backend/src/config/env.ts', content: renderEnvConfig(config) });
  files.push({ relativePath: 'backend/src/middleware/authJwt.ts', content: renderAuthJwt(config) });
  files.push({ relativePath: 'backend/src/routes/index.ts', content: renderRoutesIndex(config) });
  files.push({ relativePath: 'backend/src/routes/health.ts', content: renderHealthRoute(config) });
  files.push({ relativePath: 'backend/src/services/db.ts', content: renderDbService(config) });

  // Frontend (conditional)
  if (config.includeFrontend) {
    addFrontendFiles(files, config);
  }

  return files;
}

function buildSaasManifest(config: ScaffoldConfig): FileEntry[] {
  const files: FileEntry[] = [];

  addRootFiles(files, config);

  // Scripts
  files.push({ relativePath: 'scripts/start-local.ps1', content: renderSaasStartLocalPs1(config) });
  files.push({ relativePath: 'scripts/start-local.sh', content: renderSaasStartLocalSh(config) });
  files.push({ relativePath: 'scripts/deploy.ps1', content: renderSaasDeployPs1(config) });

  // CI/CD
  files.push({ relativePath: '.github/workflows/ci.yml', content: renderGitHubActions(config) });

  // Backend (Azure Functions)
  files.push({ relativePath: 'backend/package.json', content: renderSaasPackageJson(config) });
  files.push({ relativePath: 'backend/tsconfig.json', content: renderSaasTsconfig(config) });
  files.push({ relativePath: 'backend/host.json', content: renderHostJson(config) });
  files.push({
    relativePath: 'backend/local.settings.json.example',
    content: renderLocalSettingsExample(config),
  });
  files.push({
    relativePath: 'backend/src/functions/health.ts',
    content: renderSaasHealthFunction(config),
  });
  files.push({
    relativePath: 'backend/src/functions/api.ts',
    content: renderSaasSampleFunction(config),
  });
  files.push({ relativePath: 'backend/src/config/env.ts', content: renderSaasEnvConfig(config) });
  files.push({
    relativePath: 'backend/src/middleware/authMiddleware.ts',
    content: renderSaasAuthMiddleware(config),
  });
  files.push({ relativePath: 'backend/src/services/db.ts', content: renderSaasDbService(config) });

  // Frontend (conditional, shared with on-prem)
  if (config.includeFrontend) {
    addFrontendFiles(files, config);
  }

  return files;
}

// --- Standalone helpers ---

function getDbModule(config: ScaffoldConfig) {
  switch (config.database) {
    case 'postgresql':
      return postgresqlDb;
    case 'mongodb':
      return mongodbDb;
    default:
      return sqlserverDb;
  }
}

function addNextjsFeFrontendFiles(files: FileEntry[], config: ScaffoldConfig): void {
  files.push({ relativePath: 'frontend/package.json', content: renderNextFePackageJson(config) });
  files.push({ relativePath: 'frontend/next.config.ts', content: renderNextFeConfig(config) });
  files.push({ relativePath: 'frontend/tsconfig.json', content: renderNextFeTsconfig(config) });
  files.push({
    relativePath: 'frontend/postcss.config.mts',
    content: renderNextFePostcssConfig(config),
  });
  files.push({ relativePath: 'frontend/src/app/layout.tsx', content: renderNextFeLayout(config) });
  files.push({ relativePath: 'frontend/src/app/page.tsx', content: renderNextFePage(config) });
  files.push({
    relativePath: 'frontend/src/app/globals.css',
    content: renderNextFeGlobalsCss(config),
  });
}

function addViteFrontendFiles(files: FileEntry[], config: ScaffoldConfig): void {
  files.push({ relativePath: 'frontend/package.json', content: renderVitePackageJson(config) });
  files.push({ relativePath: 'frontend/vite.config.ts', content: renderViteConfig(config) });
  files.push({ relativePath: 'frontend/tsconfig.json', content: renderViteTsconfig(config) });
  files.push({
    relativePath: 'frontend/postcss.config.js',
    content: renderVitePostcssConfig(config),
  });
  files.push({
    relativePath: 'frontend/tailwind.config.js',
    content: renderViteTailwindConfig(config),
  });
  files.push({ relativePath: 'frontend/index.html', content: renderViteIndexHtml(config) });
  files.push({ relativePath: 'frontend/src/App.tsx', content: renderViteAppTsx(config) });
  files.push({ relativePath: 'frontend/src/main.tsx', content: renderViteMainTsx(config) });
  files.push({ relativePath: 'frontend/src/index.css', content: renderViteIndexCss(config) });
}

function addExpressBackendWithDb(files: FileEntry[], config: ScaffoldConfig): void {
  const db = getDbModule(config);
  files.push({ relativePath: 'backend/package.json', content: renderBackendPackageJson(config) });
  files.push({ relativePath: 'backend/tsconfig.json', content: renderBackendTsconfig(config) });
  files.push({ relativePath: 'backend/.env.example', content: renderBackendEnvExample(config) });
  files.push({ relativePath: 'backend/nodemon.json', content: renderNodemon(config) });
  files.push({ relativePath: 'backend/src/server.ts', content: renderServer(config) });
  files.push({ relativePath: 'backend/src/config/env.ts', content: renderEnvConfig(config) });
  files.push({ relativePath: 'backend/src/middleware/authJwt.ts', content: renderAuthJwt(config) });
  files.push({ relativePath: 'backend/src/routes/index.ts', content: renderRoutesIndex(config) });
  files.push({ relativePath: 'backend/src/routes/health.ts', content: renderHealthRoute(config) });
  files.push({ relativePath: 'backend/src/services/db.ts', content: db.renderService(config) });
}

function buildStandaloneManifest(config: ScaffoldConfig): FileEntry[] {
  const files: FileEntry[] = [];
  const isFullStack = config.frontend === 'nextjs';
  const needsAspire = !(config.database === 'mongodb' && config.mongoMode === 'atlas');

  // CI/CD
  files.push({
    relativePath: '.github/workflows/ci.yml',
    content: renderGitHubActionsStandalone(config),
  });

  // Aspire (for local DB orchestration)
  if (needsAspire) {
    files.push({ relativePath: 'apphost.ts', content: renderAppHost(config) });
    files.push({ relativePath: 'aspire.config.json', content: renderAspireConfig(config) });
    files.push({ relativePath: 'scripts/start-local.ps1', content: renderStartLocalPs1(config) });
    files.push({ relativePath: 'scripts/start-local.sh', content: renderStartLocalSh(config) });
    files.push({ relativePath: 'scripts/deploy.ps1', content: renderDeployPs1(config) });
  }

  if (isFullStack) {
    // Next.js full-stack — root files without workspace package.json
    files.push({ relativePath: '.gitignore', content: renderGitignore(config) });
    files.push({ relativePath: '.env.example', content: renderRootEnvExample(config) });
    files.push({ relativePath: 'CLAUDE.md', content: renderRootClaudeMd(config) });
    files.push({ relativePath: '.claude/CLAUDE.md', content: renderProjectClaudeMd(config) });
    files.push({ relativePath: 'docs/README.md', content: renderReadme(config) });
    files.push({ relativePath: 'docs/env-vars.md', content: renderEnvVarsDoc(config) });
    addRulesAndSkills(files);

    // Next.js full-stack — API routes handle backend, no Express
    files.push({ relativePath: 'package.json', content: renderNextjsPackageJson(config) });
    files.push({ relativePath: 'next.config.ts', content: renderNextjsConfig(config) });
    files.push({ relativePath: 'tsconfig.json', content: renderNextjsTsconfig(config) });
    files.push({ relativePath: 'postcss.config.mts', content: renderNextjsPostcssConfig(config) });
    files.push({ relativePath: 'src/app/layout.tsx', content: renderNextjsLayout(config) });
    files.push({ relativePath: 'src/app/page.tsx', content: renderNextjsPage(config) });
    files.push({ relativePath: 'src/app/globals.css', content: renderNextjsGlobalsCss(config) });
    files.push({
      relativePath: 'src/app/api/health/route.ts',
      content: renderNextjsApiHealth(config),
    });
    files.push({ relativePath: 'src/lib/env.ts', content: renderNextjsEnvConfig(config) });
    files.push({
      relativePath: 'src/lib/db.ts',
      content: getDbModule(config).renderService(config),
    });
  } else {
    // Monorepo: root files + Express backend + chosen frontend
    addRootFiles(files, config);
    addExpressBackendWithDb(files, config);

    if (config.frontend === 'angular') {
      addFrontendFiles(files, config);
    } else if (config.frontend === 'react-vite') {
      addViteFrontendFiles(files, config);
    }
  }

  return files;
}

export async function scaffold(config: ScaffoldConfig): Promise<void> {
  const { outputDir, pluginName } = config;

  console.log(chalk.blue(`\nScaffolding ${chalk.bold(pluginName)}...\n`));

  // Build file manifest based on project type
  let files: FileEntry[];
  if (config.projectType === 'standalone') {
    files = buildStandaloneManifest(config);
  } else if (config.projectType === 'saas') {
    files = buildSaasManifest(config);
  } else {
    files = buildOnPremManifest(config);
  }

  // Collect all unique directories
  const dirs = new Set<string>();
  for (const file of files) {
    const dir = path.dirname(path.join(outputDir, file.relativePath));
    let current = dir;
    while (current !== outputDir && current.startsWith(outputDir)) {
      dirs.add(current);
      current = path.dirname(current);
    }
  }

  dirs.add(outputDir);

  // Create directories (sorted so parents come first)
  const sortedDirs = [...dirs].sort();
  for (const dir of sortedDirs) {
    await mkdir(dir, { recursive: true });
  }

  // Write files
  for (const file of files) {
    const filePath = path.join(outputDir, file.relativePath);
    await writeFile(filePath, file.content, 'utf8');
    console.log(chalk.green('  ✓ ') + chalk.dim(file.relativePath));
  }

  // Install root dependencies and Aspire integration
  const usesAspire =
    config.projectType !== 'saas' &&
    !(config.database === 'mongodb' && config.mongoMode === 'atlas');
  if (usesAspire && process.env.MESA_SKIP_INSTALL !== '1') {
    console.log(chalk.blue('\nInstalling dependencies...'));
    try {
      execSync('npm install', { cwd: outputDir, stdio: 'pipe' });
      console.log(chalk.green('  ✓ ') + 'Dependencies installed');
    } catch {
      console.log(chalk.yellow('  ⚠ ') + 'npm install failed — run it manually after scaffolding');
    }

    const dbIntegration =
      config.database === 'postgresql'
        ? 'postgresql'
        : config.database === 'mongodb'
          ? 'mongodb'
          : 'sql-server';
    console.log(chalk.blue(`\nAdding Aspire ${dbIntegration} integration...`));
    try {
      execSync(`aspire add ${dbIntegration} --non-interactive`, { cwd: outputDir, stdio: 'pipe' });
      console.log(chalk.green('  ✓ ') + `Aspire ${dbIntegration} integration added`);
    } catch {
      console.log(
        chalk.yellow('  ⚠ ') +
          `aspire add ${dbIntegration} failed — run it manually: aspire add ${dbIntegration}`
      );
    }
  }

  // Initialize git
  console.log(chalk.blue('\nInitializing git repository...'));
  try {
    execSync('git init', { cwd: outputDir, stdio: 'pipe' });
    execSync('git add .', { cwd: outputDir, stdio: 'pipe' });
    execSync('git commit -m "✨ Initial scaffold via mesa-cli"', {
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

  // Summary
  const typeLabels: Record<string, string> = {
    standalone: 'standalone',
    saas: 'SaaS',
    onprem: 'on-prem',
  };
  const typeLabel = typeLabels[config.projectType] ?? config.projectType;
  console.log(
    chalk.green(
      `\n✓ Project ${chalk.bold(pluginName)} (${typeLabel}) created with ${files.length} files\n`
    )
  );
}
