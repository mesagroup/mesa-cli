import { execSync } from 'node:child_process';
import chalk from 'chalk';
import { confirm, input } from '@inquirer/prompts';
import {
  checkAllTools,
  getInstallCommand,
  getPlatformLabel,
  getGitIdentity,
  checkGhOrgAccess,
  isAdmin,
  canAutoInstall,
  runInstallCommand,
  checkTool,
  type ToolStatus,
} from '../util/tool-checker';

export interface SetupOptions {
  /** Skip confirmation prompts and auto-install everything possible. */
  yes?: boolean;
}

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

function printInstallInstructions(missing: ToolStatus[], hasAdminPrivileges: boolean): void {
  const platform = getPlatformLabel();
  const adminNote = hasAdminPrivileges ? '' : chalk.dim(' (user-level install)');

  console.log(chalk.yellow(`\n  Missing tools (${platform}${adminNote}):\n`));

  for (const r of missing) {
    const label = r.tool.required ? '' : chalk.dim(' (optional)');
    console.log(`  ${chalk.bold(r.tool.displayName)}${label}`);

    if (r.tool.requiresAdmin && !hasAdminPrivileges) {
      console.log(chalk.red('    ⚠ Requires administrator privileges\n'));
      if (r.tool.adminAlternatives) {
        console.log(chalk.dim('    Options:'));
        for (const alt of r.tool.adminAlternatives) {
          console.log(chalk.dim(`      • ${alt}`));
        }
        console.log('');
      }
    } else {
      const cmd = getInstallCommand(r.tool, !hasAdminPrivileges);
      const installable = canAutoInstall(r.tool) || cmd.length > 0;
      const note = installable ? chalk.dim(' (will auto-install)') : '';
      console.log(`    ${chalk.cyan(cmd || 'no install command available for this platform')}${note}\n`);
    }
  }
}

async function attemptInstall(tool: ToolStatus): Promise<void> {
  const cmd = getInstallCommand(tool.tool);
  console.log(chalk.dim(`  Installing ${tool.tool.displayName}...`));
  if (cmd) {
    console.log(chalk.dim(`    $ ${cmd}`));
  }

  const success = await runInstallCommand(tool.tool);

  if (success) {
    const recheck = checkTool(tool.tool);
    if (recheck.installed) {
      console.log(chalk.green(`  ✓ ${tool.tool.displayName} v${recheck.version} installed\n`));
    } else {
      console.log(
        chalk.yellow(
          `  ⚠ ${tool.tool.displayName} install command completed but tool not detected. You may need to restart your shell.\n`
        )
      );
    }
  } else {
    console.log(chalk.red(`  ✗ Failed to install ${tool.tool.displayName}\n`));
  }
}

async function checkToolsLoop(opts: SetupOptions = {}): Promise<boolean> {
  let allGood = false;
  const hasAdminPrivileges = isAdmin();
  const autoYes = Boolean(opts.yes);

  if (!hasAdminPrivileges) {
    console.log(chalk.yellow('  ℹ Running without administrator privileges'));
    console.log(chalk.dim('    User-level install options will be provided where available\n'));
  }

  while (!allGood) {
    console.log(chalk.dim('  Checking required tools...\n'));

    const results = checkAllTools();
    printToolTable(results);

    const missing = results.filter(r => !r.installed);
    const missingRequired = missing.filter(r => r.tool.required);

    if (missing.length === 0) {
      console.log(chalk.green.bold('\n  All tools are installed!\n'));
      allGood = true;
      break;
    }

    printInstallInstructions(missing, hasAdminPrivileges);

    if (missingRequired.length === 0) {
      console.log(chalk.green('  All required tools are installed.'));
      console.log(chalk.dim('  Optional tools can be installed later.\n'));
      allGood = true;
      break;
    }

    // Tools we are willing to attempt to install: anything not gated by missing admin
    // privileges. We try `runInstallCommand` for ALL of them, which falls back to the
    // shell command when no typed auto-installer exists.
    const installable = missing.filter(
      r => !r.tool.requiresAdmin || hasAdminPrivileges
    );

    if (installable.length > 0) {
      const shouldInstall = autoYes
        ? true
        : await confirm({
            message: `Install ${installable.length} tool(s) now?`,
            default: true,
          });

      if (shouldInstall) {
        console.log('');
        for (const tool of installable) {
          await attemptInstall(tool);
        }

        continue;
      }
    }

    if (autoYes) {
      // Non-interactive run: don't loop forever; report what's still missing and exit.
      console.log(
        chalk.yellow('\n  Some tools could not be auto-installed. Install them manually.\n')
      );
      return missingRequired.length === 0;
    }

    const skip = await confirm({
      message: 'Install the missing tools manually, then press Enter to re-check. Skip?',
      default: false,
    });

    if (skip) {
      console.log(chalk.yellow('\n  Skipping tool check. Some features may not work.\n'));
      return false;
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

export async function setupCommand(opts: SetupOptions = {}): Promise<boolean> {
  console.log(chalk.blue.bold('\n  MESA Environment Setup\n'));

  // Phase 1: Tool check
  const toolsOk = await checkToolsLoop(opts);

  // Phase 2: Git identity
  await checkGitIdentity();

  // Phase 3: GitHub org access
  await checkGitHubAccess();

  if (toolsOk) {
    console.log(chalk.green.bold('  Setup complete!\n'));
  }

  return toolsOk;
}
