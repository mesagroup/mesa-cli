import { execSync } from 'node:child_process';
import chalk from 'chalk';
import { confirm, input } from '@inquirer/prompts';
import open from 'open';
import {
  checkAllTools,
  getInstallCommand,
  getPlatformLabel,
  getGitIdentity,
  checkGhOrgAccess,
  type ToolStatus,
} from '../util/tool-checker';
import { validateGitHubName } from '../util/naming';

function printToolTable(results: ToolStatus[]): void {
  const nameWidth = Math.max(...results.map(r => r.tool.displayName.length)) + 2;

  for (const r of results) {
    let icon: string;
    let versionText: string;

    if (!r.installed) {
      icon = chalk.red('  ✗');
      versionText = chalk.red('not found') + (r.tool.required ? '' : chalk.dim(' (optional)'));
    } else if (r.outdated) {
      icon = chalk.yellow('  ⚠');
      const upgradeHint = r.tool.minVersion 
        ? chalk.yellow(` (requires >= ${r.tool.minVersion} — update needed)`)
        : '';
      versionText = chalk.dim(`v${r.version}`) + upgradeHint;
    } else {
      icon = chalk.green('  ✓');
      versionText = chalk.dim(`v${r.version}`);
    }

    const name = r.tool.displayName.padEnd(nameWidth);
    console.log(`${icon} ${name} ${versionText}`);
  }
}

function printInstallInstructions(missing: ToolStatus[]): void {
  const platform = getPlatformLabel();

  console.log(chalk.yellow(`\n  Missing tools (${platform}):\n`));

  for (const r of missing) {
    const cmd = getInstallCommand(r.tool);
    const label = r.tool.required ? '' : chalk.dim(' (optional)');
    console.log(`  ${chalk.bold(r.tool.displayName)}${label}`);
    console.log(`    ${chalk.cyan(cmd)}\n`);
  }
}

function printUpgradeInstructions(outdated: ToolStatus[]): void {
  const platform = getPlatformLabel();

  console.log(chalk.yellow(`\n  Outdated tools (${platform}):\n`));

  for (const r of outdated) {
    const cmd = getInstallCommand(r.tool);
    const label = r.tool.required ? '' : chalk.dim(' (optional)');
    const minVer = r.tool.minVersion ?? 'latest';
    console.log(`  ${chalk.bold(r.tool.displayName)}${label}`);
    console.log(`    Current: ${chalk.red(`v${r.version}`)} → Required: ${chalk.green(`>= ${minVer}`)}`);
    console.log(`    ${chalk.cyan(cmd)}\n`);
  }
}

async function checkToolsLoop(): Promise<boolean> {
  let allGood = false;

  while (!allGood) {
    console.log(chalk.dim('  Checking required tools...\n'));

    const results = checkAllTools();
    printToolTable(results);

    const missing = results.filter(r => !r.installed);
    const missingRequired = missing.filter(r => r.tool.required);
    const outdated = results.filter(r => r.installed && r.outdated);
    const outdatedRequired = outdated.filter(r => r.tool.required);

    const hasIssues = missing.length > 0 || outdated.length > 0;
    const hasRequiredIssues = missingRequired.length > 0 || outdatedRequired.length > 0;

    if (!hasIssues) {
      console.log(chalk.green.bold('\n  All tools are installed and up to date!\n'));
      allGood = true;
      break;
    }

    if (missing.length > 0) {
      printInstallInstructions(missing);
    }

    if (outdated.length > 0) {
      printUpgradeInstructions(outdated);
    }

    if (!hasRequiredIssues) {
      console.log(chalk.green('  All required tools are installed and up to date.'));
      console.log(chalk.dim('  Optional tools can be installed/updated later.\n'));
      allGood = true;
      break;
    }

    const skip = await confirm({
      message: 'Install/update the tools above, then press Enter to re-check. Skip?',
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
    console.log(chalk.yellow('\n  ⚠ Git identity still incomplete. You can configure it later.\n'));
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
    validate(value) {
      const result = validateGitHubName(value);
      return result.valid || result.error!;
    },
  });

  const orgValidation = validateGitHubName(org);
  if (!orgValidation.valid) {
    console.log(chalk.yellow(`\n  ⚠ Invalid organization name: ${orgValidation.error}\n`));
    return;
  }

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
      console.log(chalk.yellow('\n  ⚠ Still not authenticated. You can run `gh auth login` later.\n'));
      return;
    }

    // Continue with updated status
    return handleOrgAccess(updated, org);
  }

  console.log(chalk.green('  ✓') + ` Authenticated as ${chalk.bold(status.ghUser)}`);
  await handleOrgAccess(status, org);
}

async function handleOrgAccess(status: { ghUser: string; hasOrgAccess: boolean }, org: string): Promise<void> {
  if (status.hasOrgAccess) {
    console.log(chalk.green('  ✓') + ` Access to ${chalk.bold(org)} organization confirmed\n`);
    return;
  }

  console.log(chalk.red('  ✗') + ` No access to ${chalk.bold(org)} organization\n`);
  console.log(chalk.yellow('  You need to be a member of the organization to create repositories.'));
  console.log(chalk.dim('  Options:\n'));
  console.log(`    1. Ask your org admin to invite ${chalk.bold(status.ghUser)} to ${chalk.bold(org)}`);
  console.log(`    2. Open: ${chalk.cyan(`https://github.com/orgs/${org}/people`)}`);
  console.log(`    3. Contact your team lead for access\n`);

  const openPage = await confirm({
    message: `Open the ${org} members page in browser?`,
    default: true,
  });

  if (openPage) {
    try {
      await open(`https://github.com/orgs/${encodeURIComponent(org)}/people`);
      console.log(chalk.dim('  Opened in browser.\n'));
    } catch {
      console.log(chalk.dim(`  Visit: https://github.com/orgs/${org}/people\n`));
    }
  }
}

export async function setupCommand(): Promise<boolean> {
  console.log(chalk.blue.bold('\n  MESA Environment Setup\n'));

  // Phase 1: Tool check
  const toolsOk = await checkToolsLoop();

  // Phase 2: Git identity
  await checkGitIdentity();

  // Phase 3: GitHub org access
  await checkGitHubAccess();

  if (toolsOk) {
    console.log(chalk.green.bold('  Setup complete!\n'));
  }

  return toolsOk;
}
