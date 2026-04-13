import { execSync } from 'node:child_process';
import type { ProjectType } from '../types/scaffold';

export interface ToolInfo {
  name: string;
  displayName: string;
  checkCommand: string;
  versionPattern?: RegExp;
  installMac: string;
  installWin: string;
  upgradeMac?: string;
  upgradeWin?: string;
  minVersion?: string;
  required: boolean;
}

export interface ToolStatus {
  tool: ToolInfo;
  installed: boolean;
  version: string;
  outdated: boolean;
}

const isWindows = process.platform === 'win32';

export const TOOLS: ToolInfo[] = [
  {
    name: 'git',
    displayName: 'Git',
    checkCommand: 'git --version',
    versionPattern: /git version ([\d.]+)/,
    installMac: 'brew install git',
    installWin: 'winget install --id Git.Git',
    upgradeMac: 'brew upgrade git',
    upgradeWin: 'winget upgrade --id Git.Git',
    required: true,
  },
  {
    name: 'node',
    displayName: 'Node.js',
    checkCommand: 'node --version',
    versionPattern: /v([\d.]+)/,
    installMac: 'brew install node',
    installWin: 'winget install --id OpenJS.NodeJS.LTS',
    upgradeMac: 'brew upgrade node',
    upgradeWin: 'winget upgrade --id OpenJS.NodeJS.LTS',
    minVersion: '20.0.0',
    required: true,
  },
  {
    name: 'gh',
    displayName: 'GitHub CLI',
    checkCommand: 'gh --version',
    versionPattern: /gh version ([\d.]+)/,
    installMac: 'brew install gh',
    installWin: 'winget install --id GitHub.cli',
    upgradeMac: 'brew upgrade gh',
    upgradeWin: 'winget upgrade --id GitHub.cli',
    required: false,
  },
  {
    name: 'func',
    displayName: 'Azure Functions Core Tools',
    checkCommand: 'func --version',
    versionPattern: /([\d.]+)/,
    installMac: 'npm install -g azure-functions-core-tools@4 --unsafe-perm true',
    installWin: 'npm install -g azure-functions-core-tools@4 --unsafe-perm true',
    upgradeMac: 'npm install -g azure-functions-core-tools@4 --unsafe-perm true',
    upgradeWin: 'npm install -g azure-functions-core-tools@4 --unsafe-perm true',
    minVersion: '4.0.0',
    required: true,
  },
  {
    name: 'docker',
    displayName: 'Docker',
    checkCommand: 'docker --version',
    versionPattern: /Docker version ([\d.]+)/,
    installMac: 'brew install --cask docker',
    installWin: 'winget install --id Docker.DockerDesktop',
    upgradeMac: 'brew upgrade --cask docker',
    upgradeWin: 'winget upgrade --id Docker.DockerDesktop',
    required: true,
  },
  {
    name: 'dotnet',
    displayName: '.NET SDK',
    checkCommand: 'dotnet --version',
    versionPattern: /([\d.]+)/,
    installMac: 'brew install dotnet',
    installWin: 'winget install --id Microsoft.DotNet.SDK.10',
    upgradeMac: 'brew upgrade dotnet',
    upgradeWin: 'winget upgrade --id Microsoft.DotNet.SDK.10',
    required: false,
  },
  {
    name: 'aspire',
    displayName: 'Aspire CLI',
    checkCommand: 'aspire --version',
    versionPattern: /([\d.]+)/,
    installMac: 'curl -sSL https://aspire.dev/install.sh | bash',
    installWin: 'irm https://aspire.dev/install.ps1 | iex',
    upgradeMac: 'curl -sSL https://aspire.dev/install.sh | bash',
    upgradeWin: 'irm https://aspire.dev/install.ps1 | iex',
    minVersion: '13.2.0',
    required: true,
  },
];

export function isVersionOutdated(current: string, min: string): boolean {
  const parse = (v: string) => v.split('.').map(n => Number.parseInt(n, 10) || 0);
  const cur = parse(current);
  const req = parse(min);
  const len = Math.max(cur.length, req.length);
  for (let i = 0; i < len; i++) {
    const c = cur[i] ?? 0;
    const r = req[i] ?? 0;
    if (c < r) return true;
    if (c > r) return false;
  }

  return false;
}

export function checkTool(tool: ToolInfo): ToolStatus {
  try {
    const output = execSync(tool.checkCommand, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
      timeout: 10_000,
    }).trim();

    let version = 'installed';
    if (tool.versionPattern) {
      const match = tool.versionPattern.exec(output);
      if (match?.[1]) {
        version = match[1];
      }
    }

    const outdated = tool.minVersion ? isVersionOutdated(version, tool.minVersion) : false;

    return { tool, installed: true, version, outdated };
  } catch {
    return { tool, installed: false, version: '', outdated: false };
  }
}

export function checkAllTools(tools: ToolInfo[] = TOOLS): ToolStatus[] {
  return tools.map(tool => checkTool(tool));
}

/**
 * Returns tools relevant for a specific project type.
 * Both standalone and on-prem need all tools (Git, Node, Docker, .NET, Aspire).
 * SaaS replaces Aspire/.NET with Azure Functions.
 */
export function getToolsForProjectType(projectType: ProjectType): ToolInfo[] {
  const sharedTools = TOOLS.filter(tool => ['git', 'node', 'gh'].includes(tool.name));

  if (projectType === 'saas') {
    return [...sharedTools, TOOLS.find(tool => tool.name === 'func')!];
  }

  return [
    ...sharedTools,
    ...TOOLS.filter(tool => ['docker', 'dotnet', 'aspire'].includes(tool.name)),
  ];
}

export function getInstallCommand(tool: ToolInfo): string {
  return isWindows ? tool.installWin : tool.installMac;
}

export function getUpgradeCommand(tool: ToolInfo): string {
  if (isWindows) {
    return tool.upgradeWin ?? tool.installWin;
  }

  return tool.upgradeMac ?? tool.installMac;
}

export function getPlatformLabel(): string {
  return isWindows ? 'Windows' : 'macOS';
}

// --- Git identity checks ---

export interface GitIdentity {
  name: string;
  email: string;
}

export function getGitIdentity(): GitIdentity {
  let name = '';
  let email = '';
  try {
    name = execSync('git config user.name', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
  } catch {
    /* not configured */
  }
  try {
    email = execSync('git config user.email', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
  } catch {
    /* not configured */
  }
  return { name, email };
}

// --- GitHub org access checks ---

export interface GhOrgStatus {
  authenticated: boolean;
  ghUser: string;
  hasOrgAccess: boolean;
}

export function checkGhOrgAccess(org: string): GhOrgStatus {
  const result: GhOrgStatus = { authenticated: false, ghUser: '', hasOrgAccess: false };

  // Check if gh is authenticated
  try {
    const status = execSync('gh auth status 2>&1', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 10_000,
    });
    if (status.includes('Logged in')) {
      result.authenticated = true;
    }
  } catch (error: unknown) {
    // gh auth status exits non-zero when not logged in, but may still output info
    const output =
      error instanceof Error && 'stdout' in error
        ? String((error as { stdout: string }).stdout)
        : '';
    if (output.includes('Logged in')) {
      result.authenticated = true;
    }
  }

  if (!result.authenticated) return result;

  // Get gh username
  try {
    result.ghUser = execSync('gh api user -q .login', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
      timeout: 10_000,
    }).trim();
  } catch {
    /* ignore */
  }

  // Check org membership
  try {
    const orgs = execSync('gh api user/orgs -q ".[].login"', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
      timeout: 10_000,
    });
    result.hasOrgAccess = orgs.split('\n').some(o => o.trim().toLowerCase() === org.toLowerCase());
  } catch {
    /* ignore */
  }

  return result;
}

export function requestGhOrgAccess(org: string): boolean {
  try {
    // gh api to request org membership (sends a membership request)
    execSync(`gh api -X POST orgs/${org}/memberships/{username} 2>&1`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
      timeout: 10_000,
    });
    return true;
  } catch {
    return false;
  }
}
