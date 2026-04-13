import type { ScaffoldConfig } from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
  const lines = [
    `# start-local.ps1 - Start the local Azure Functions development environment`,
    `# Usage: .\\scripts\\start-local.ps1`,
    ``,
    `$ErrorActionPreference = "Stop"`,
    `$scriptDir = $PSScriptRoot`,
    `$projectRoot = Split-Path -Parent $scriptDir`,
    ``,
    `Write-Host "=== Starting local dev environment for ${config.pluginName} ===" -ForegroundColor Cyan`,
    ``,
    `# Check Azure Functions Core Tools is installed`,
    `try {`,
    `    func --version | Out-Null`,
    `    Write-Host "[OK] Azure Functions Core Tools is installed" -ForegroundColor Green`,
    `} catch {`,
    `    Write-Host "[ERROR] Azure Functions Core Tools is not installed." -ForegroundColor Red`,
    `    Write-Host "  Install it with: npm install -g azure-functions-core-tools@4 --unsafe-perm true" -ForegroundColor Yellow`,
    `    exit 1`,
    `}`,
    ``,
    `# Start Azure Functions host`,
    `Write-Host "Starting Azure Functions host..." -ForegroundColor Yellow`,
  ];

  if (config.includeFrontend) {
    lines.push(
      ``,
      `# Start backend in a new process so we can run frontend in parallel`,
      `$backendJob = Start-Process -FilePath "func" -ArgumentList "start" -WorkingDirectory "$projectRoot\\backend" -PassThru -NoNewWindow`,
      `Write-Host "Backend started (PID: $($backendJob.Id))" -ForegroundColor Green`,
      ``,
      `# Start frontend`,
      `Write-Host "Starting frontend (ng serve)..." -ForegroundColor Yellow`,
      `Set-Location "$projectRoot\\frontend"`,
      `ng serve`
    );
  } else {
    lines.push(`Set-Location "$projectRoot\\backend"`, `func start`);
  }

  lines.push(``);

  return lines.join('\n');
}
