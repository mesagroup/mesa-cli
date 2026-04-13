import type { ScaffoldConfig } from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
  const lines = [
    `# deploy.ps1 - Build and prepare deployment artifacts`,
    `# Usage: .\\scripts\\deploy.ps1 -Environment dev|staging|prod`,
    ``,
    `param(`,
    `    [Parameter(Mandatory=$true)]`,
    `    [ValidateSet("dev", "staging", "prod")]`,
    `    [string]$Environment`,
    `)`,
    ``,
    `$ErrorActionPreference = "Stop"`,
    `$scriptDir = $PSScriptRoot`,
    `$projectRoot = Split-Path -Parent $scriptDir`,
    ``,
    `Write-Host "=== Deploying ${config.pluginName} ($Environment) ===" -ForegroundColor Cyan`,
    ``,
    `# -- Backend build (V7: npm ci with package-lock.json) --`,
    `Write-Host "Installing backend dependencies..." -ForegroundColor Yellow`,
    `npm ci --prefix "$projectRoot\\backend"`,
    ``,
    `Write-Host "Building backend (tsc)..." -ForegroundColor Yellow`,
    `npm run build --prefix "$projectRoot\\backend"`,
    ``,
  ];

  if (config.includeFrontend) {
    lines.push(
      `# -- Frontend build (V7: npm ci + ng build --configuration production) --`,
      `Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow`,
      `npm ci --prefix "$projectRoot\\frontend"`,
      ``,
      `Write-Host "Building frontend (ng build)..." -ForegroundColor Yellow`,
      `npm run build --prefix "$projectRoot\\frontend"`,
      ``
    );
  }

  lines.push(
    `# -- Output summary --`,
    `Write-Host "" -ForegroundColor Green`,
    `Write-Host "=== Build complete ===" -ForegroundColor Green`,
    `Write-Host "Backend output:  $projectRoot\\backend\\dist\\" -ForegroundColor White`
  );

  if (config.includeFrontend) {
    lines.push(
      `Write-Host "Frontend output: $projectRoot\\frontend\\dist\\" -ForegroundColor White`
    );
  }

  lines.push(
    `Write-Host "" -ForegroundColor White`,
    `Write-Host "Next steps:" -ForegroundColor Yellow`,
    `Write-Host "  1. Copy backend/dist/ to the target server" -ForegroundColor White`,
    `Write-Host "  2. Copy backend/node_modules/ (production only) to the target server" -ForegroundColor White`
  );

  if (config.includeFrontend) {
    lines.push(
      `Write-Host "  3. Copy frontend/dist/ to the web server or CDN" -ForegroundColor White`
    );
  }

  lines.push(
    `Write-Host "  ${config.includeFrontend ? '4' : '3'}. Configure environment variables on the target server" -ForegroundColor White`,
    ``
  );

  return lines.join('\n');
}
