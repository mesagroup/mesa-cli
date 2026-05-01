import chalk from 'chalk';

const BANNER_LINES = [
  '  __  __ ______  _____   _____',
  ' |  \\/  |  ____|/ ____| / ____|',
  ' | \\  / | |__  | (___  | |',
  ' | |\\/| |  __|  \\___ \\ | |',
  ' | |  | | |____ ____) || |____',
  ' |_|  |_|______|_____/  \\_____|',
];

export interface BannerOptions {
  /** Suppress the banner regardless of env. */
  quiet?: boolean;
  /** Sub-title rendered below the banner (e.g. "Scaffolder & architecture toolkit"). */
  subtitle?: string;
}

/**
 * Returns true if the banner should be suppressed.
 *
 * Suppression sources, in order:
 *   - `opts.quiet === true`
 *   - `process.env.MESA_NO_BANNER === '1'`
 *   - `process.env.MESA_QUIET === '1'`
 */
export function shouldSuppressBanner(opts: BannerOptions = {}): boolean {
  if (opts.quiet) return true;
  if (process.env.MESA_NO_BANNER === '1') return true;
  if (process.env.MESA_QUIET === '1') return true;
  return false;
}

/**
 * Print the MESA ASCII banner to stdout.
 * Honors MESA_NO_BANNER / MESA_QUIET env vars and the optional `quiet` flag.
 */
export function printBanner(opts: BannerOptions = {}): void {
  if (shouldSuppressBanner(opts)) return;

  const colored = BANNER_LINES.map(line => chalk.cyan.bold(line)).join('\n');
  process.stdout.write('\n' + colored + '\n');

  if (opts.subtitle) {
    process.stdout.write(chalk.dim('  ' + opts.subtitle) + '\n');
  }

  process.stdout.write('\n');
}
