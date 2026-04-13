import type { ScaffoldConfig } from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
  const lines = [
    `# deploy.ps1 - Build and deploy Azure Functions app`,
    `# Usage: .\\scripts\\deploy.ps1 -Environment dev|staging|prod`,
    ``,
    `param(`,
    `    [ValidateSet("dev", "staging", "prod")]`,
    `    [string]$Environment = "dev",`,
    ``,
    `    [string]$FunctionAppName = $env:AZURE_FUNCTION_APP_NAME`,
    `)`,
    ``,
    `$ErrorActionPreference = "Stop"`,
    `$scriptDir = $PSScriptRoot`,
    `$projectRoot = Split-Path -Parent $scriptDir`,
    ``,
    `if (-not $FunctionAppName) {`,
    `    Write-Host "[ERROR] FunctionAppName is required. Set AZURE_FUNCTION_APP_NAME or pass -FunctionAppName." -ForegroundColor Red`,
    `    exit 1`,
    `}`,
    ``,
    `Write-Host "=== Deploying ${config.pluginName} ($Environment) ===" -ForegroundColor Cyan`,
    ``,
    `# -- Backend: install, test, build --`,
    `Write-Host "Installing backend dependencies..." -ForegroundColor Yellow`,
    `npm ci --prefix "$projectRoot\\backend"`,
    ``,
    `Write-Host "Running backend tests..." -ForegroundColor Yellow`,
    `npm test --prefix "$projectRoot\\backend"`,
    ``,
    `Write-Host "Building backend..." -ForegroundColor Yellow`,
    `npm run build --prefix "$projectRoot\\backend"`,
    ``,
  ];

  if (config.includeFrontend) {
    lines.push(
      `# -- Frontend: install, build --`,
      `Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow`,
      `npm ci --prefix "$projectRoot\\frontend"`,
      ``,
      `Write-Host "Building frontend (production)..." -ForegroundColor Yellow`,
      `npm run build --prefix "$projectRoot\\frontend" -- --configuration production`,
      ``
    );
  }

  lines.push(
    `# -- Deploy to Azure --`,
    `Write-Host "Publishing to Azure Function App: $FunctionAppName ..." -ForegroundColor Yellow`,
    `Set-Location "$projectRoot\\backend"`,
    `func azure functionapp publish $FunctionAppName`,
    ``,
    `Write-Host "" -ForegroundColor Green`,
    `Write-Host "=== Deployment complete ($Environment) ===" -ForegroundColor Green`,
    ``
  );

  return lines.join('\n');
}
