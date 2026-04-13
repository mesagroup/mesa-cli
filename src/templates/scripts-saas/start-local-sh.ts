import type { ScaffoldConfig } from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
  const lines = [
    `#!/usr/bin/env bash`,
    `# start-local.sh - Start the local Azure Functions development environment`,
    `# Usage: ./scripts/start-local.sh`,
    ``,
    `set -euo pipefail`,
    `SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"`,
    `PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"`,
    ``,
    `echo "=== Starting local dev environment for ${config.pluginName} ==="`,
    ``,
    `# Check Azure Functions Core Tools is installed`,
    `if ! command -v func &> /dev/null; then`,
    `    echo "[ERROR] Azure Functions Core Tools is not installed."`,
    `    echo "  Install it with: npm install -g azure-functions-core-tools@4 --unsafe-perm true"`,
    `    exit 1`,
    `fi`,
    `echo "[OK] Azure Functions Core Tools is installed"`,
    ``,
  ];

  if (config.includeFrontend) {
    lines.push(
      `# Start backend in the background`,
      `echo "Starting Azure Functions host..."`,
      `(cd "$PROJECT_ROOT/backend" && func start) &`,
      `BACKEND_PID=$!`,
      `echo "Backend started (PID: $BACKEND_PID)"`,
      ``,
      `# Start frontend in the foreground`,
      `echo "Starting frontend (ng serve)..."`,
      `cd "$PROJECT_ROOT/frontend"`,
      `ng serve`,
      ``,
      `# Clean up background process on exit`,
      `trap "kill $BACKEND_PID 2>/dev/null" EXIT`
    );
  } else {
    lines.push(
      `# Start Azure Functions host`,
      `echo "Starting Azure Functions host..."`,
      `cd "$PROJECT_ROOT/backend"`,
      `func start`
    );
  }

  lines.push(``);

  return lines.join('\n');
}
