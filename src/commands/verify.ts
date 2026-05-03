import path from 'node:path';
import chalk from 'chalk';
import { runChecks, type CheckResult } from '../util/verify';

export interface VerifyOptions {
  cwd?: string;
  json?: boolean;
  explain?: boolean;
}

/**
 * Run all architecture checks against `opts.cwd` (defaults to process.cwd()).
 * Returns the process exit code (0 = all checks passed, 1 = at least one hard failure).
 *
 * Warnings (`result.warning === true`) do NOT cause a non-zero exit.
 */
export async function verifyCommand(opts: VerifyOptions = {}): Promise<number> {
  const cwd = path.resolve(opts.cwd ?? process.cwd());
  const results = await runChecks(cwd);

  const allPassed = results.every(r => r.passed);
  const hardFailures = results.filter(r => !r.passed && !r.warning);

  if (opts.json) {
    const payload = {
      cwd,
      passed: hardFailures.length === 0,
      checks: results,
    };
    process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
    return hardFailures.length === 0 ? 0 : 1;
  }

  printPretty(cwd, results, opts);
  return hardFailures.length === 0 ? 0 : 1;
}

function printPretty(cwd: string, results: CheckResult[], opts: VerifyOptions): void {
  console.log(chalk.blue.bold('  MESA Architecture Verification'));
  console.log(chalk.dim(`  Target: ${cwd}\n`));

  const titleWidth = Math.max(...results.map(r => r.title.length)) + 2;

  for (const r of results) {
    const icon = r.passed ? chalk.green('  ✓') : r.warning ? chalk.yellow('  ⚠') : chalk.red('  ✗');
    const title = r.title.padEnd(titleWidth);
    const status = r.passed
      ? r.warning
        ? chalk.yellow('warn')
        : chalk.green('pass')
      : chalk.red('fail');
    console.log(`${icon} ${title} ${status}`);
    console.log(chalk.dim(`      ${r.message}`));
    if (opts.explain && r.evidence && r.evidence.length > 0) {
      for (const line of r.evidence) {
        console.log(chalk.dim(`        • ${line}`));
      }
    }
    console.log('');
  }

  const passedCount = results.filter(r => r.passed).length;
  const total = results.length;
  const summary = passedCount === total
    ? chalk.green.bold(`  All ${total} checks passed.\n`)
    : chalk.red.bold(`  ${passedCount}/${total} checks passed.\n`);
  console.log(summary);

  if (!opts.explain && results.some(r => r.evidence && r.evidence.length > 0)) {
    console.log(chalk.dim('  Tip: pass --explain to see the matched evidence per check.\n'));
  }
}
