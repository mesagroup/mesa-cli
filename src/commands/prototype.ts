import path from 'node:path';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { confirm, input } from '@inquirer/prompts';
import chalk from 'chalk';
import { toKebabCase, toPascalCase, validatePluginName } from '../util/naming';
import { generateFancyName } from '../util/name-generator';
import { scaffoldPrototype, type PrototypeConfig } from '../generators/prototype-scaffold';
import { maybeCreateGithubRepo } from '../util/github-repo';

export interface PrototypeFlags {
  author?: string;
  description?: string;
  dryRun?: boolean;
  yes?: boolean;
  /** Skip the optional `gh repo create` step entirely. */
  noGithub?: boolean;
  /** Default GitHub org for repo creation prompt. */
  githubOrg?: string;
}

const isInteractive = () => process.stdin.isTTY === true;

function getGitUserName(): string {
  try {
    return execSync('git config user.name', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

export async function prototypeCommand(
  nameArg: string | undefined,
  flags: PrototypeFlags
): Promise<void> {
  console.log(chalk.blue.bold('  MESA Prototype Scaffolder'));
  console.log(chalk.dim('  Stack: Vercel + Next.js + Hono + Neon (managed Postgres)\n'));

  const useDefaults = flags.yes || !isInteractive();
  const fancyDefault = generateFancyName();

  // 1. Name.
  let projectName: string;
  if (nameArg) {
    projectName = toKebabCase(nameArg);
  } else if (useDefaults) {
    projectName = fancyDefault;
    console.log(chalk.dim(`  Using generated name: ${chalk.bold(projectName)}\n`));
  } else {
    const raw = await input({
      message: 'Project name:',
      default: fancyDefault,
      validate(value) {
        const result = validatePluginName(toKebabCase(value));
        return result.valid || result.error!;
      },
    });
    projectName = toKebabCase(raw);
  }

  const validation = validatePluginName(projectName);
  if (!validation.valid) {
    console.error(chalk.red(`Error: ${validation.error}`));
    process.exit(1);
  }

  // 2. Description.
  const defaultDescription = 'Vercel + Next.js + Hono + Neon prototype';
  let description: string;
  if (flags.description) {
    description = flags.description;
  } else if (useDefaults) {
    description = defaultDescription;
  } else {
    description = await input({ message: 'Description:', default: defaultDescription });
  }

  // 3. Author.
  let author: string;
  if (flags.author) {
    author = flags.author;
  } else if (useDefaults) {
    author = getGitUserName() || 'mesa-cli';
  } else {
    author = await input({ message: 'Author:', default: getGitUserName() || 'mesa-cli' });
  }

  const outputDir = path.resolve(process.cwd(), projectName);
  if (existsSync(outputDir)) {
    console.error(chalk.red(`\nError: Directory "${projectName}" already exists.`));
    process.exit(1);
  }

  const className = toPascalCase(projectName);

  const config: PrototypeConfig = {
    name: projectName,
    className,
    description,
    author,
    outputDir,
  };

  if (flags.dryRun) {
    console.log(chalk.yellow('\nDry run — no files will be created.\n'));
    console.log(chalk.dim('Config:'), JSON.stringify(config, null, 2));
    return;
  }

  if (isInteractive() && !useDefaults) {
    const proceed = await confirm({
      message: `Create prototype in ${chalk.bold(outputDir)}?`,
      default: true,
    });
    if (!proceed) return;
  }

  await scaffoldPrototype(config);

  await maybeCreateGithubRepo(outputDir, projectName, {
    skip: flags.noGithub,
    defaultOrg: flags.githubOrg,
  });

  // Next steps.
  console.log(chalk.blue.bold('  Next steps:\n'));
  console.log(chalk.dim('  Prerequisites:'));
  console.log('    - pnpm 10+ (npm i -g pnpm)');
  console.log('    - Neon account (https://neon.tech) for managed Postgres');
  console.log('    - Vercel account + `vercel link` to define preview/production envs');
  console.log('    - GitHub repo with VERCEL_* secrets configured\n');

  console.log(chalk.dim('  Get started:'));
  console.log(`    cd ${projectName}`);
  console.log('    cp .env.example .env.local       # Fill in NEON_DATABASE_URL + JWT_SECRET');
  console.log('    pnpm install');
  console.log('    pnpm db:push                     # Apply Drizzle schema to Neon');
  console.log('    pnpm dev                         # Next.js + Hono on http://localhost:3000\n');

  console.log(chalk.dim('  Deploy:'));
  console.log('    vercel link                                              # Link the project');
  console.log('    gh workflow run deploy.yml -f environment=preview        # Manual preview deploy');
  console.log('    gh workflow run deploy.yml -f environment=production     # Manual prod deploy\n');

  console.log(chalk.dim('  Verify:'));
  console.log(`    mesa verify --cwd ${projectName}\n`);
}
