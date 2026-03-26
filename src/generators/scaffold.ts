import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';
import chalk from 'chalk';
import type { ScaffoldConfig } from '../types/scaffold';

// Backend templates
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

// Aspire templates
import { render as renderAppHost } from '../templates/aspire/apphost';
import { render as renderAspireConfig } from '../templates/aspire/aspire-config';

// Root templates
import { render as renderRootPackageJson } from '../templates/root/package-json';
import { render as renderGitignore } from '../templates/root/gitignore';
import { render as renderRootEnvExample } from '../templates/root/env-example';
import { renderRoot as renderRootClaudeMd, renderProject as renderProjectClaudeMd } from '../templates/root/claude-md';
import { render as renderReadme } from '../templates/root/readme';
import { render as renderEnvVarsDoc } from '../templates/root/env-vars-doc';

// Script templates
import { render as renderStartLocalPs1 } from '../templates/scripts/start-local-ps1';
import { render as renderStartLocalSh } from '../templates/scripts/start-local-sh';
import { render as renderDeployPs1 } from '../templates/scripts/deploy-ps1';

// Frontend templates (conditionally imported)
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

function buildFileManifest(config: ScaffoldConfig): FileEntry[] {
  const { pluginName, includeFrontend } = config;
  const files: FileEntry[] = [];

  // Root files
  files.push({ relativePath: 'package.json', content: renderRootPackageJson(config) });
  files.push({ relativePath: '.gitignore', content: renderGitignore(config) });
  files.push({ relativePath: '.env.example', content: renderRootEnvExample(config) });
  files.push({ relativePath: 'CLAUDE.md', content: renderRootClaudeMd(config) });
  files.push({ relativePath: '.claude/CLAUDE.md', content: renderProjectClaudeMd(config) });

  // Aspire
  files.push({ relativePath: 'apphost.ts', content: renderAppHost(config) });
  files.push({ relativePath: 'aspire.config.json', content: renderAspireConfig(config) });

  // Docs
  files.push({ relativePath: 'docs/README.md', content: renderReadme(config) });
  files.push({ relativePath: 'docs/env-vars.md', content: renderEnvVarsDoc(config) });

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
  if (includeFrontend) {
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
    files.push({ relativePath: 'frontend/src/app/app.module.ts', content: renderDevAppModule(config) });
    files.push({ relativePath: 'frontend/src/app/app.component.ts', content: renderDevAppComponent(config) });
  }

  return files;
}

export async function scaffold(config: ScaffoldConfig): Promise<void> {
  const { outputDir, pluginName } = config;

  console.log(chalk.blue(`\nScaffolding ${chalk.bold(pluginName)}...\n`));

  // Build file manifest
  const files = buildFileManifest(config);

  // Collect all unique directories
  const dirs = new Set<string>();
  for (const file of files) {
    const dir = path.dirname(path.join(outputDir, file.relativePath));
    // Add the dir and all parent dirs up to outputDir
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

  // Initialize git
  console.log(chalk.blue('\nInitializing git repository...'));
  try {
    execSync('git init', { cwd: outputDir, stdio: 'pipe' });
    execSync('git add .', { cwd: outputDir, stdio: 'pipe' });
    execSync('git commit -m "✨ Initial scaffold via mesa-cli"', {
      cwd: outputDir,
      stdio: 'pipe',
      env: { ...process.env, GIT_AUTHOR_NAME: config.author || 'mesa-cli', GIT_COMMITTER_NAME: config.author || 'mesa-cli' },
    });
    console.log(chalk.green('  ✓ ') + 'Git repository initialized with initial commit');
  } catch {
    console.log(chalk.yellow('  ⚠ ') + 'Git initialization failed (git may not be installed)');
  }

  // Summary
  console.log(chalk.green(`\n✓ Project ${chalk.bold(pluginName)} created with ${files.length} files\n`));
}
