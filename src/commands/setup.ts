import chalk from 'chalk';
import { confirm } from '@inquirer/prompts';
import {
  checkAllTools,
  getInstallCommand,
  getPlatformLabel,
  type ToolStatus,
} from '../util/tool-checker';

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

export async function setupCommand(): Promise<boolean> {
  console.log(chalk.blue.bold('\n  MESA Environment Setup\n'));

  let allGood = false;

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

    printInstallInstructions(missing);

    if (missingRequired.length === 0) {
      console.log(chalk.green('  All required tools are installed.'));
      console.log(chalk.dim('  Optional tools can be installed later.\n'));
      allGood = true;
      break;
    }

    const recheck = await confirm({
      message: 'Install the missing tools above, then press Enter to re-check. Skip?',
      default: false,
    });

    if (recheck) {
      // User chose to skip
      console.log(chalk.yellow('\n  Skipping setup. Some features may not work.\n'));
      return false;
    }

    console.log('');
  }

  return true;
}
