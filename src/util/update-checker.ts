import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKAGE_NAME = '@mesagroup/mesa-cli';
const BIN_NAME = 'mesa';

export interface CliInstallInfo {
  /** How the CLI is currently installed/invoked. */
  method: 'npm-global' | 'pnpm-global' | 'yarn-global' | 'npx-cache' | 'local' | 'unknown';
  /** Absolute path of the package root (containing package.json), if known. */
  packageRoot?: string;
  /** Currently-running version (from disk). */
  currentVersion?: string;
}

export interface VersionCheck {
  current?: string;
  latest?: string;
  upToDate: boolean;
}

/**
 * Walk up from `start` looking for a package.json. Returns the directory.
 */
function findPackageRoot(start: string): string | undefined {
  let dir = resolve(start);
  while (true) {
    if (existsSync(join(dir, 'package.json'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

function readPackageVersion(packageRoot: string): string | undefined {
  try {
    const pkg = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')) as {
      version?: string;
      name?: string;
    };
    if (pkg.name === PACKAGE_NAME) return pkg.version;
  } catch {
    /* ignore */
  }

  return undefined;
}

function safeExec(cmd: string, timeout = 10_000): string | undefined {
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
      timeout,
    }).trim();
  } catch {
    return undefined;
  }
}

/**
 * Detects how the currently-running `mesa` CLI was installed. Used to choose
 * the correct package-manager invocation for self-update.
 *
 * Detection order:
 *  1. If the resolved script path lives under a known global prefix (npm/pnpm/yarn)
 *     → return that method.
 *  2. If it lives under an npx download cache → return 'npx-cache'.
 *  3. If it lives under any node_modules → return 'local'.
 *  4. Otherwise 'unknown'.
 *
 * Note: this is best-effort. We never rely on it for correctness — if we get
 * it wrong, the user just sees a manual install command instead.
 */
export function detectCliInstallMethod(): CliInstallInfo {
  let scriptPath: string;
  try {
    scriptPath = fileURLToPath(import.meta.url);
  } catch {
    return { method: 'unknown' };
  }

  const packageRoot = findPackageRoot(scriptPath);
  const currentVersion = packageRoot ? readPackageVersion(packageRoot) : undefined;

  const npmPrefix = safeExec('npm config get prefix');
  const pnpmGlobalDir = safeExec('pnpm root -g');
  const yarnGlobalDir = safeExec('yarn global dir', 5_000);

  const candidate = packageRoot ?? scriptPath;
  const normalizedCandidate = candidate.replace(/\\/g, '/');

  const includesIgnoreCase = (haystack: string, needle: string) =>
    haystack.toLowerCase().includes(needle.toLowerCase());

  if (npmPrefix && includesIgnoreCase(normalizedCandidate, npmPrefix.replace(/\\/g, '/'))) {
    return { method: 'npm-global', packageRoot, currentVersion };
  }

  if (pnpmGlobalDir && includesIgnoreCase(normalizedCandidate, pnpmGlobalDir.replace(/\\/g, '/'))) {
    return { method: 'pnpm-global', packageRoot, currentVersion };
  }

  if (yarnGlobalDir && includesIgnoreCase(normalizedCandidate, yarnGlobalDir.replace(/\\/g, '/'))) {
    return { method: 'yarn-global', packageRoot, currentVersion };
  }

  if (
    includesIgnoreCase(normalizedCandidate, '/_npx/') ||
    includesIgnoreCase(normalizedCandidate, '/npm-cache/_npx/')
  ) {
    return { method: 'npx-cache', packageRoot, currentVersion };
  }

  if (includesIgnoreCase(normalizedCandidate, '/node_modules/')) {
    return { method: 'local', packageRoot, currentVersion };
  }

  return { method: 'unknown', packageRoot, currentVersion };
}

/**
 * Returns the shell command that would update the CLI for the given install
 * method, or undefined if no automated upgrade is possible.
 */
export function getCliUpdateCommand(method: CliInstallInfo['method']): string | undefined {
  switch (method) {
    case 'npm-global':
      return `npm install -g ${PACKAGE_NAME}@latest`;
    case 'pnpm-global':
      return `pnpm add -g ${PACKAGE_NAME}@latest`;
    case 'yarn-global':
      return `yarn global add ${PACKAGE_NAME}@latest`;
    case 'local':
      return `npm install ${PACKAGE_NAME}@latest`;
    case 'npx-cache':
    case 'unknown':
    default:
      return undefined;
  }
}

/**
 * Looks up the latest version of the CLI on the npm registry. Returns
 * undefined if the network call fails (offline, registry unreachable, etc.).
 */
export function fetchLatestCliVersion(): string | undefined {
  return safeExec(`npm view ${PACKAGE_NAME} version`, 15_000);
}

export function compareVersions(current?: string, latest?: string): VersionCheck {
  if (!current || !latest) {
    return { current, latest, upToDate: false };
  }

  return { current, latest, upToDate: current === latest };
}

export { PACKAGE_NAME, BIN_NAME };
