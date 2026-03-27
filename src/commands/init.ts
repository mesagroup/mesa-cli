import path from 'node:path';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { input, confirm, select } from '@inquirer/prompts';
import chalk from 'chalk';
import { toKebabCase, toPascalCase, validatePluginName } from '../util/naming';
import { generateFancyName } from '../util/name-generator';
import { scaffold } from '../generators/scaffold';
import type { ProjectType, ScaffoldConfig } from '../types/scaffold';

export interface InitFlags {
  noFrontend?: boolean;
  author?: string;
  description?: string;
  dryRun?: boolean;
  yes?: boolean;
}

function getGitUserName(): string {
  try {
    return execSync('git config user.name', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function isGhAvailable(): boolean {
  try {
    execSync('gh --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

const isInteractive = () => process.stdin.isTTY === true;

export async function initCommand(projectNameArg: string | undefined, flags: InitFlags): Promise<void> {
  console.log(chalk.blue.bold('\n  MESA Project Scaffolder\n'));

  const useDefaults = flags.yes || !isInteractive();

  // 1. Project type selection
  let projectType: ProjectType;
  if (useDefaults) {
    projectType = 'onprem';
  } else {
    projectType = await select<ProjectType>({
      message: 'Project type:',
      choices: [
        { value: 'onprem', name: 'Plugin (on premise)' },
        { value: 'saas', name: 'Plugin (SaaS)' },
        { value: 'standalone' as unknown as ProjectType, name: `Standalone App ${chalk.yellow('(coming soon)')}`, disabled: true },
      ],
    });
  }

  // 2. Plugin name (with fancy default)
  const fancyDefault = generateFancyName();
  let pluginName: string;

  if (projectNameArg) {
    pluginName = toKebabCase(projectNameArg);
  } else if (useDefaults) {
    pluginName = fancyDefault;
    console.log(chalk.dim(`  Using generated name: ${chalk.bold(pluginName)}\n`));
  } else {
    const rawName = await input({
      message: 'Plugin name:',
      default: fancyDefault,
      validate(value) {
        const result = validatePluginName(toKebabCase(value));
        return result.valid || result.error!;
      },
    });
    pluginName = toKebabCase(rawName);
  }

  const validation = validatePluginName(pluginName);
  if (!validation.valid) {
    console.error(chalk.red(`Error: ${validation.error}`));
    process.exit(1);
  }

  // 3. Description
  let description: string;
  if (flags.description) {
    description = flags.description;
  } else if (useDefaults) {
    description = 'MESAPPA plugin';
  } else {
    description = await input({
      message: 'Description:',
      default: 'MESAPPA plugin',
    });
  }

  // 4. Include frontend?
  let includeFrontend: boolean;
  if (flags.noFrontend !== undefined && flags.noFrontend) {
    includeFrontend = false;
  } else if (useDefaults) {
    includeFrontend = true;
  } else {
    includeFrontend = await confirm({
      message: 'Include Angular 16 frontend?',
      default: true,
    });
  }

  // 5. Author
  let author: string;
  if (flags.author) {
    author = flags.author;
  } else if (useDefaults) {
    author = getGitUserName() || 'mesa-cli';
  } else {
    author = await input({
      message: 'Author:',
      default: flags.author ?? getGitUserName(),
    });
  }

  // 6. Check output dir
  const outputDir = path.resolve(process.cwd(), pluginName);
  if (existsSync(outputDir)) {
    console.error(chalk.red(`\nError: Directory "${pluginName}" already exists.`));
    process.exit(1);
  }

  const pluginClassName = toPascalCase(pluginName);

  const config: ScaffoldConfig = {
    projectType,
    pluginName,
    pluginClassName,
    description,
    author,
    includeFrontend,
    outputDir,
  };

  // 7. Dry run?
  if (flags.dryRun) {
    console.log(chalk.yellow('\nDry run — no files will be created.\n'));
    console.log(chalk.dim('Config:'), JSON.stringify(config, null, 2));
    return;
  }

  // 8. Scaffold
  await scaffold(config);

  // 9. GitHub step
  if (isInteractive() && isGhAvailable()) {
    const createRepo = await confirm({
      message: 'Create GitHub repository on MESA organization?',
      default: true,
    });

    if (createRepo) {
      const defaultOrg = process.env.MESA_GITHUB_ORG ?? 'mesagroup';
      const org = await input({
        message: 'GitHub organization:',
        default: defaultOrg,
      });

      try {
        console.log(chalk.blue('\nCreating GitHub repository...'));
        execSync(`gh repo create ${org}/${pluginName} --private --source . --push`, {
          cwd: outputDir,
          stdio: 'inherit',
        });
        console.log(chalk.green('  ✓ ') + `Repository created: ${org}/${pluginName}`);
      } catch {
        console.log(chalk.yellow('  ⚠ ') + 'GitHub repository creation failed. You can create it manually later.');
      }
    }
  } else if (!isInteractive()) {
    console.log(chalk.dim('\n  Tip: Run interactively to auto-create GitHub repo, or use: gh repo create\n'));
  } else {
    console.log(chalk.dim('\n  Tip: Install GitHub CLI (gh) to auto-create repos on MESA org.\n'));
  }

  // 10. Next steps
  console.log(chalk.blue.bold('  Next steps:\n'));
  if (projectType === 'saas') {
    console.log(chalk.dim('  Prerequisites:'));
    console.log('    - Azure Functions Core Tools: npm i -g azure-functions-core-tools@4');
    console.log('    - Azure CLI (optional): https://aka.ms/installazurecli\n');
    console.log(chalk.dim('  Get started:'));
    console.log(`    cd ${pluginName}`);
    console.log('    npm run install:all');
    console.log('    npm run dev            # Starts Azure Functions' + (includeFrontend ? ' + Angular dev server' : '') + '\n');
  } else {
    console.log(chalk.dim('  Prerequisites:'));
    console.log('    - Docker Desktop (for SQL Server container)');
    console.log('    - .NET SDK 10+ (for Aspire CLI): dotnet tool install -g aspire.cli\n');
    console.log(chalk.dim('  Get started:'));
    console.log(`    cd ${pluginName}`);
    console.log('    npm run install:all');
    console.log('    aspire run            # Starts SQL Server + backend' + (includeFrontend ? ' + frontend' : '') + ' + dashboard\n');
  }
}
