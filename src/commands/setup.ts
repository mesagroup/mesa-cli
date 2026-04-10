import { execSync } from 'node:child_process';
import chalk from 'chalk';
import { confirm, input } from '@inquirer/prompts';
import {
  checkAllTools,
  getInstallCommand,
  getUpgradeCommand,
  getGitIdentity,
  checkGhOrgAccess,
  getToolsForProjectType,
  type ToolStatus,
} from '../util/tool-checker';
import type { ProjectType } from '../types/scaffold';

function printToolTable(results: ToolStatus[]): void {
  const nameWidth = Math.max(...results.map(r => r.tool.displayName.length)) + 2;

  for (const r of results) {
    const icon = r.installed ? chalk.green('  ✓') : chalk.red('  ✗');
    const name = r.tool.displayName.padEnd(nameWidth);
    const version = r.installed
      ? chalk.dim(`v${r.version}`)
      : chalk.red('not found') + (r.tool.required ? '' : chalk.dim(' (optional)'));

    console.log(`${icon} ${name} ${version}`);
  }
}

function runCommand(cmd: string): boolean {
  try {
    execSync(cmd, { stdio: 'inherit', timeout: 300_000 });
    return true;
  } catch {
    return false;
  }
}

async function checkToolsLoop(projectType: ProjectType): Promise<boolean> {
  let allGood = false;
  const tools = getToolsForProjectType(projectType);

  while (!allGood) {
    console.log(chalk.dim('  Checking required tools...\n'));

    const results = checkAllTools(tools);
    printToolTable(results);

    const missing = results.filter(r => !r.installed);
    const outdated = results.filter(r => r.installed && r.outdated);
    const actionable = [...missing, ...outdated];
    const missingRequired = missing.filter(r => r.tool.required);
    const outdatedRequired = outdated.filter(r => r.tool.required);

    if (actionable.length === 0) {
      console.log(chalk.green.bold('\n  All tools are installed and up to date!\n'));
      allGood = true;
      break;
    }

    if (missingRequired.length === 0 && outdatedRequired.length === 0) {
      console.log(chalk.green('\n  All required tools are installed and up to date.'));
      console.log(chalk.dim('  Optional tools can be installed/upgraded later.\n'));
      allGood = true;
      break;
    }

    console.log('');
    let anyInstalled = false;

    for (const r of actionable) {
      const isMissing = !r.installed;
      const action = isMissing ? 'Install' : 'Upgrade';
      const cmd = isMissing ? getInstallCommand(r.tool) : getUpgradeCommand(r.tool);
      const label = r.tool.required ? '' : chalk.dim(' (optional)');

      const proceed = await confirm({
        message: `${action} ${r.tool.displayName}${label}? ${chalk.dim(`→ ${cmd}`)}`,
        default: r.tool.required,
      });

      if (proceed) {
        console.log(chalk.blue(`\n  Running: ${cmd}\n`));
        const ok = runCommand(cmd);
        if (ok) {
          console.log(
            chalk.green(
              `\n  ✓ ${r.tool.displayName} ${isMissing ? 'installed' : 'upgraded'} successfully\n`
            )
          );
          anyInstalled = true;
        } else {
          console.log(
            chalk.red(
              `\n  ✗ ${r.tool.displayName} ${action.toLowerCase()} failed. You can try manually:\n`
            )
          );
          console.log(chalk.cyan(`    ${cmd}\n`));
        }
      } else {
        console.log('');
      }
    }

    if (!anyInstalled) {
      const skip = await confirm({
        message: 'No changes were made. Skip tool check?',
        default: false,
      });
      if (skip) {
        console.log(chalk.yellow('\n  Skipping tool check. Some features may not work.\n'));
        return false;
      }
    }

    console.log('');
  }

  return true;
}

async function checkGitIdentity(): Promise<void> {
  console.log(chalk.dim('  Checking Git identity...\n'));

  const identity = getGitIdentity();

  if (identity.name && identity.email) {
    console.log(chalk.green('  ✓') + ` Git user: ${identity.name} <${identity.email}>\n`);
    return;
  }

  console.log(chalk.red('  ✗') + ' Git identity not configured\n');

  if (!identity.name) {
    console.log(chalk.yellow('  Your Git user name is not set. Configure it with:'));
    console.log(chalk.cyan('    git config --global user.name "Your Name"\n'));
  }

  if (!identity.email) {
    console.log(chalk.yellow('  Your Git email is not set. Configure it with:'));
    console.log(chalk.cyan('    git config --global user.email "your.email@company.com"\n'));
  }

  const recheck = await confirm({
    message: 'Configure Git identity now, then press Enter to re-check. Skip?',
    default: false,
  });

  if (recheck) {
    console.log(chalk.yellow('  Skipping Git identity check.\n'));
    return;
  }

  // Re-check after user configures
  const updated = getGitIdentity();
  if (updated.name && updated.email) {
    console.log(chalk.green('\n  ✓') + ` Git user: ${updated.name} <${updated.email}>\n`);
  } else {
    console.log(
      chalk.yellow('\n  ⚠ Git identity still incomplete. You can configure it later.\n')
    );
  }
}

async function checkGitHubAccess(): Promise<void> {
  const defaultOrg = process.env.MESA_GITHUB_ORG ?? 'mesagroup';

  // Check if gh is even installed
  try {
    execSync('gh --version', { stdio: 'pipe' });
  } catch {
    console.log(chalk.dim('  Skipping GitHub org check (gh not installed).\n'));
    return;
  }

  console.log(chalk.dim('  Checking GitHub access...\n'));

  const org = await input({
    message: 'GitHub organization to verify access:',
    default: defaultOrg,
  });

  const status = checkGhOrgAccess(org);

  // Step 1: Check authentication
  if (!status.authenticated) {
    console.log(chalk.red('\n  ✗') + ' Not authenticated with GitHub CLI\n');
    console.log(chalk.yellow('  Login with:'));
    console.log(chalk.cyan('    gh auth login\n'));

    const recheck = await confirm({
      message: 'Login to GitHub now, then press Enter to re-check. Skip?',
      default: false,
    });

    if (recheck) {
      console.log(chalk.yellow('  Skipping GitHub check.\n'));
      return;
    }

    // Re-check
    const updated = checkGhOrgAccess(org);
    if (!updated.authenticated) {
      console.log(
        chalk.yellow('\n  ⚠ Still not authenticated. You can run `gh auth login` later.\n')
      );
      return;
    }

    // Continue with updated status
    return handleOrgAccess(updated, org);
  }

  console.log(chalk.green('  ✓') + ` Authenticated as ${chalk.bold(status.ghUser)}`);
  await handleOrgAccess(status, org);
}

async function handleOrgAccess(
  status: { ghUser: string; hasOrgAccess: boolean },
  org: string
): Promise<void> {
  if (status.hasOrgAccess) {
    console.log(chalk.green('  ✓') + ` Access to ${chalk.bold(org)} organization confirmed\n`);
    return;
  }

  console.log(chalk.red('  ✗') + ` No access to ${chalk.bold(org)} organization\n`);
  console.log(
    chalk.yellow('  You need to be a member of the organization to create repositories.')
  );
  console.log(chalk.dim('  Options:\n'));
  console.log(
    `    1. Ask your org admin to invite ${chalk.bold(status.ghUser)} to ${chalk.bold(org)}`
  );
  console.log(`    2. Open: ${chalk.cyan(`https://github.com/orgs/${org}/people`)}`);
  console.log(`    3. Contact your team lead for access\n`);

  const openPage = await confirm({
    message: `Open the ${org} members page in browser?`,
    default: true,
  });

  if (openPage) {
    try {
      const openCmd = process.platform === 'win32' ? 'start' : 'open';
      execSync(`${openCmd} https://github.com/orgs/${org}/people`, { stdio: 'ignore' });
      console.log(chalk.dim('  Opened in browser.\n'));
    } catch {
      console.log(chalk.dim(`  Visit: https://github.com/orgs/${org}/people\n`));
    }
  }
}

export async function setupCommand(projectType: ProjectType = 'onprem'): Promise<boolean> {
  console.log(chalk.blue.bold('\n  MESA Environment Setup\n'));

  // Phase 1: Tool check (install missing + upgrade outdated)
  const toolsOk = await checkToolsLoop(projectType);

  // Phase 2: Git identity
  await checkGitIdentity();

  // Phase 3: GitHub org access
  await checkGitHubAccess();

  if (toolsOk) {
    console.log(chalk.green.bold('  Setup complete!\n'));
  }

  return toolsOk;
}
