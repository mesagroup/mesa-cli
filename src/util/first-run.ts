import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const MESA_DIR = join(homedir(), '.mesa-cli');
const SETUP_MARKER = join(MESA_DIR, 'setup-done');

export function isFirstRun(): boolean {
  return !existsSync(SETUP_MARKER);
}

export function markSetupDone(): void {
  mkdirSync(MESA_DIR, { recursive: true });
  writeFileSync(SETUP_MARKER, new Date().toISOString(), 'utf8');
}
