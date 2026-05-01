import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  '.turbo',
  'dist',
  'build',
  'out',
  '.modules',
  '.vercel',
  '.cache',
  '.pnpm-store',
  'coverage',
]);

export interface WalkOptions {
  /** Maximum recursion depth (default 8). */
  maxDepth?: number;
  /** Additional directory names to skip. */
  ignoreDirs?: string[];
}

/**
 * Recursively yield absolute file paths starting from `root`,
 * skipping common build/vendor directories.
 */
export function* walkFiles(root: string, opts: WalkOptions = {}): Generator<string> {
  const maxDepth = opts.maxDepth ?? 8;
  const ignoreDirs = new Set([...IGNORED_DIRS, ...(opts.ignoreDirs ?? [])]);

  function* recurse(dir: string, depth: number): Generator<string> {
    if (depth > maxDepth) return;
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }

    for (const entry of entries) {
      const full = path.join(dir, entry);
      let stats;
      try {
        stats = statSync(full);
      } catch {
        continue;
      }

      if (stats.isDirectory()) {
        if (ignoreDirs.has(entry)) continue;
        yield* recurse(full, depth + 1);
      } else if (stats.isFile()) {
        yield full;
      }
    }
  }

  yield* recurse(root, 0);
}

/**
 * Yield only files whose extension matches one of the given extensions.
 * Extensions should include the dot (e.g. '.ts').
 */
export function* walkByExt(
  root: string,
  exts: string[],
  opts: WalkOptions = {}
): Generator<string> {
  const set = new Set(exts);
  for (const file of walkFiles(root, opts)) {
    if (set.has(path.extname(file))) yield file;
  }
}

export function safeRead(file: string): string {
  try {
    return readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

export function safeReadJson<T = unknown>(file: string): T | null {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as T;
  } catch {
    return null;
  }
}

/** Find every `package.json` in the workspace (ignoring node_modules). */
export function findPackageJsons(root: string): string[] {
  const out: string[] = [];
  for (const file of walkFiles(root)) {
    if (path.basename(file) === 'package.json') out.push(file);
  }
  return out;
}

interface PackageJsonShape {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

/**
 * Returns the union of dep names across dependencies/devDependencies/peerDependencies/optionalDependencies
 * for every package.json found under `root`.
 */
export function collectAllDeps(root: string): { deps: Set<string>; sources: string[] } {
  const deps = new Set<string>();
  const sources: string[] = [];

  for (const pkgPath of findPackageJsons(root)) {
    const json = safeReadJson<PackageJsonShape>(pkgPath);
    if (!json) continue;
    let added = false;
    for (const block of [
      json.dependencies,
      json.devDependencies,
      json.peerDependencies,
      json.optionalDependencies,
    ]) {
      if (!block) continue;
      for (const name of Object.keys(block)) {
        if (!deps.has(name)) added = true;
        deps.add(name);
      }
    }
    if (added) sources.push(pkgPath);
  }

  return { deps, sources };
}

/** Find files matching a basename. */
export function findFilesByName(root: string, names: string[]): string[] {
  const set = new Set(names);
  const out: string[] = [];
  for (const file of walkFiles(root)) {
    if (set.has(path.basename(file))) out.push(file);
  }
  return out;
}
