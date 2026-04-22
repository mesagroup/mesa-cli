import { execSync } from 'node:child_process';
import chalk from 'chalk';
import { confirm } from '@inquirer/prompts';
import {
  checkAllTools,
  checkTool,
  canUpgrade,
  upgradeTool,
  getUpgradeCommand,
  isAdmin,
  type ToolInfo,
  type ToolStatus,
} from '../util/tool-checker';
import {
  detectCliInstallMethod,
  fetchLatestCliVersion,
  getCliUpdateCommand,
  compareVersions,
  PACKAGE_NAME,
  BIN_NAME,
} from '../util/update-checker';

export interface UpdateFlags {
  cliOnly?: boolean;
  toolsOnly?: boolean;
  dryRun?: boolean;
  yes?: boolean;
}

const isInteractive = () => process.stdin.isTTY === true;

function printVersionLine(label: string, current: string | undefined, latest: string | undefined) {
  const c = current ?? chalk.dim('?');
  const l = latest ?? chalk.dim('?');
  if (current && latest && current === latest) {
    console.log(`  ${chalk.green('✓')} ${label.padEnd(16)} ${chalk.dim('v' + c)} (up to date)`);
  } else if (current && latest) {
    console.log(
      `  ${chalk.yellow('↑')} ${label.padEnd(16)} ${chalk.dim('v' + c)} → ${chalk.bold('v' + l)}`
    );
  } else {
    console.log(`  ${chalk.dim('?')} ${label.padEnd(16)} current=${c} latest=${l}`);
  }
}

async function updateCli(flags: UpdateFlags): Promise<void> {
  console.log(chalk.blue.bold('\n  Updating MESA CLI\n'));

  const info = detectCliInstallMethod();
  console.log(
    chalk.dim(
      `  Install method: ${chalk.bold(info.method)}` +
        (info.packageRoot ? `  (${info.packageRoot})` : '')
    )
  );

  const latest = fetchLatestCliVersion();
  printVersionLine(BIN_NAME, info.currentVersion, latest);

  if (!latest) {
    console.log(
      chalk.yellow('  ⚠ ') +
        'Could not reach the npm registry to check for updates. Skipping CLI update.'
    );
    return;
  }

  const check = compareVersions(info.currentVersion, latest);
  if (check.upToDate) {
    console.log(chalk.green('  ✓ CLI is already on the latest version.'));
    return;
  }

  const cmd = getCliUpdateCommand(info.method);
  if (!cmd) {
    console.log(
      chalk.yellow('  ⚠ ') +
        `Cannot auto-update from a "${info.method}" install. Run this manually:`
    );
    console.log(`    ${chalk.cyan(`npm install -g ${PACKAGE_NAME}@latest`)}`);
    return;
  }

  console.log(`  Running: ${chalk.cyan(cmd)}`);
  if (flags.dryRun) {
    console.log(chalk.dim('  (dry-run — not executing)'));
    return;
  }

  if (!flags.yes && isInteractive()) {
    const ok = await confirm({ message: `Update ${BIN_NAME} to v${latest} now?`, default: true });
    if (!ok) {
      console.log(chalk.dim('  Skipped.'));
      return;
    }
  }

  try {
    execSync(cmd, { stdio: 'inherit', timeout: 300_000 });
    console.log(
      chalk.green(
        `\n  ✓ ${BIN_NAME} updated. Restart your shell if the version still reads ${info.currentVersion}.`
      )
    );
  } catch {
    console.log(chalk.red(`\n  ✗ Failed to update ${BIN_NAME}. Try running:`));
    console.log(`    ${chalk.cyan(cmd)}`);
  }
}

interface ToolUpgradePlan {
  tool: ToolInfo;
  before: string;
  cmd: string;
}

function planToolUpgrades(): { plan: ToolUpgradePlan[]; skipped: ToolStatus[] } {
  const results = checkAllTools();
  const plan: ToolUpgradePlan[] = [];
  const skipped: ToolStatus[] = [];

  for (const r of results) {
    if (!r.installed) {
      skipped.push(r);
      continue;
    }

    if (!canUpgrade(r.tool)) {
      skipped.push(r);
      continue;
    }

    const cmd = getUpgradeCommand(r.tool);
    if (!cmd) {
      skipped.push(r);
      continue;
    }

    plan.push({ tool: r.tool, before: r.version, cmd });
  }

  return { plan, skipped };
}

async function updateTools(flags: UpdateFlags): Promise<void> {
  console.log(chalk.blue.bold('\n  Updating dev tools\n'));

  if (process.platform !== 'darwin' && process.platform !== 'win32') {
    console.log(
      chalk.yellow('  ⚠ ') +
        `Tool upgrades only support macOS and Windows. Detected platform: ${process.platform}.`
    );
    console.log(
      chalk.dim('  Use your distro package manager (apt/dnf/pacman) to upgrade tools manually.')
    );
    return;
  }

  if (!isAdmin()) {
    console.log(chalk.yellow('  ℹ Running without administrator privileges'));
    console.log(chalk.dim('    User-level upgrades will be used where available\n'));
  }

  const { plan, skipped } = planToolUpgrades();

  if (skipped.length > 0) {
    console.log(chalk.dim('  Skipping:'));
    for (const r of skipped) {
      const reason = r.installed ? 'no upgrade command on this platform' : 'not installed';
      console.log(chalk.dim(`    - ${r.tool.displayName} (${reason})`));
    }
    console.log('');
  }

  if (plan.length === 0) {
    console.log(chalk.green('  ✓ Nothing to upgrade.'));
    return;
  }

  console.log(chalk.dim('  Upgrade plan:'));
  for (const p of plan) {
    console.log(
      `    - ${p.tool.displayName.padEnd(14)} ${chalk.dim('v' + p.before)}  →  ${chalk.cyan(p.cmd)}`
    );
  }
  console.log('');

  if (flags.dryRun) {
    console.log(chalk.dim('  (dry-run — not executing)'));
    return;
  }

  if (!flags.yes && isInteractive()) {
    const ok = await confirm({ message: `Upgrade ${plan.length} tool(s) now?`, default: true });
    if (!ok) {
      console.log(chalk.dim('  Skipped.'));
      return;
    }
  }

  let upgraded = 0;
  let failed = 0;
  for (const p of plan) {
    console.log(chalk.blue(`\n  → Upgrading ${p.tool.displayName}`));
    const ok = await upgradeTool(p.tool);
    if (!ok) {
      failed += 1;
      console.log(chalk.red(`    ✗ Upgrade failed for ${p.tool.displayName}`));
      continue;
    }

    const after = checkTool(p.tool);
    if (after.installed) {
      if (after.version === p.before) {
        console.log(
          chalk.green(
            `    ✓ ${p.tool.displayName} already on the latest version (v${after.version})`
          )
        );
      } else {
        console.log(
          chalk.green(`    ✓ ${p.tool.displayName} upgraded: v${p.before} → v${after.version}`)
        );
      }
      upgraded += 1;
    } else {
      console.log(
        chalk.yellow(
          `    ⚠ ${p.tool.displayName} upgrade ran but tool is not detectable. Restart your shell.`
        )
      );
    }
  }

  console.log('');
  console.log(
    chalk.bold(`  Summary: `) +
      `${chalk.green(upgraded + ' upgraded')}` +
      (failed ? `, ${chalk.red(failed + ' failed')}` : '') +
      (skipped.length ? `, ${chalk.dim(skipped.length + ' skipped')}` : '')
  );
}

export async function updateCommand(flags: UpdateFlags = {}): Promise<void> {
  if (flags.cliOnly && flags.toolsOnly) {
    console.error(chalk.red('Error: --cli-only and --tools-only are mutually exclusive.'));
    process.exit(1);
  }

  console.log(chalk.blue.bold('\n  MESA Update'));

  if (!flags.toolsOnly) {
    await updateCli(flags);
  }

  if (!flags.cliOnly) {
    await updateTools(flags);
  }

  console.log('');
}
