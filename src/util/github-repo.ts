import { execSync } from 'node:child_process';
import { confirm, input } from '@inquirer/prompts';
import chalk from 'chalk';

export function isGhAvailable(): boolean {
  try {
    execSync('gh --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function isInteractive(): boolean {
  return process.stdin.isTTY === true;
}

export interface CreateGithubRepoOptions {
  /** Default org. Falls back to MESA_GITHUB_ORG env var, then 'mesagroup'. */
  defaultOrg?: string;
  /** Skip even when interactive + gh present. */
  skip?: boolean;
  /** Force private repo (default: true). */
  private?: boolean;
}

/**
 * Optional GitHub repo creation + push.
 *
 * No-ops (with a hint) when stdin is not a TTY or `gh` is not on PATH.
 * Failures are non-fatal — caller continues with a yellow warning.
 */
export async function maybeCreateGithubRepo(
  outputDir: string,
  pluginName: string,
  options: CreateGithubRepoOptions = {}
): Promise<void> {
  if (options.skip) {
    return;
  }

  if (!isInteractive() || !isGhAvailable()) {
    if (!isInteractive()) {
      console.log(
        chalk.dim('\n  Tip: run interactively to auto-create the GitHub repo, or use: gh repo create\n')
      );
    } else {
      console.log(chalk.dim('\n  Tip: install GitHub CLI (gh) to auto-create repos.\n'));
    }
    return;
  }

  const createRepo = await confirm({
    message: 'Create GitHub repository now?',
    default: true,
  });
  if (!createRepo) return;

  const defaultOrg = options.defaultOrg ?? process.env.MESA_GITHUB_ORG ?? 'mesagroup';
  const org = await input({
    message: 'GitHub organization:',
    default: defaultOrg,
  });

  const visibility = options.private === false ? '--public' : '--private';

  try {
    console.log(chalk.blue('\nCreating GitHub repository...'));
    execSync(`gh repo create ${org}/${pluginName} ${visibility} --source . --push`, {
      cwd: outputDir,
      stdio: 'inherit',
    });
    console.log(chalk.green('  ✓ ') + `Repository created: ${org}/${pluginName}`);
  } catch {
    console.log(
      chalk.yellow('  ⚠ ') + 'GitHub repository creation failed. You can create it manually later.'
    );
  }
}
