import { execSync } from 'node:child_process';
import type { ProjectType } from '../types/scaffold';

export interface ToolInfo {
  name: string;
  displayName: string;
  checkCommand: string;
  versionPattern?: RegExp;
  minVersion?: string;
  minVersionByProjectType?: Partial<Record<ProjectType, string>>;
  installMac: string;
  installWin: string;
  required: boolean;
}

export interface ToolStatus {
  tool: ToolInfo;
  installed: boolean;
  version: string;
  outdated: boolean;
}

/**
 * Compares two semver-like version strings (major.minor.patch).
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(n => Number.parseInt(n, 10) || 0);
  const partsB = b.split('.').map(n => Number.parseInt(n, 10) || 0);
  
  const maxLen = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < maxLen; i++) {
    const numA = partsA[i] ?? 0;
    const numB = partsB[i] ?? 0;
    if (numA < numB) return -1;
    if (numA > numB) return 1;
  }
  return 0;
}

/**
 * Checks if a version meets the minimum required version.
 */
export function meetsMinVersion(version: string, minVersion: string): boolean {
  return compareVersions(version, minVersion) >= 0;
}

const isWindows = process.platform === 'win32';

export const TOOLS: ToolInfo[] = [
  {
    name: 'git',
    displayName: 'Git',
    checkCommand: 'git --version',
    versionPattern: /git version ([\d.]+)/,
    minVersion: '2.30',
    installMac: 'brew install git',
    installWin: 'winget install --id Git.Git',
    required: true,
  },
  {
    name: 'node',
    displayName: 'Node.js',
    checkCommand: 'node --version',
    versionPattern: /v([\d.]+)/,
    minVersion: '18.0',
    installMac: 'brew install node',
    installWin: 'winget install --id OpenJS.NodeJS.LTS',
    required: true,
  },
  {
    name: 'gh',
    displayName: 'GitHub CLI',
    checkCommand: 'gh --version',
    versionPattern: /gh version ([\d.]+)/,
    installMac: 'brew install gh',
    installWin: 'winget install --id GitHub.cli',
    required: false,
  },
  {
    name: 'docker',
    displayName: 'Docker',
    checkCommand: 'docker --version',
    versionPattern: /Docker version ([\d.]+)/,
    minVersion: '20.0',
    installMac: 'brew install --cask docker',
    installWin: 'winget install --id Docker.DockerDesktop',
    required: true,
  },
  {
    name: 'dotnet',
    displayName: '.NET SDK',
    checkCommand: 'dotnet --version',
    versionPattern: /([\d.]+)/,
    minVersion: '8.0',
    minVersionByProjectType: {
      onprem: '10.0',
      standalone: '10.0',
      saas: '8.0',
    },
    installMac: 'brew install dotnet',
    installWin: 'winget install --id Microsoft.DotNet.SDK.10',
    required: false,
  },
  {
    name: 'aspire',
    displayName: 'Aspire CLI',
    checkCommand: 'aspire --version',
    versionPattern: /([\d.]+)/,
    minVersion: '13.0',
    installMac: 'curl -sSL https://aspire.dev/install.sh | bash',
    installWin: 'irm https://aspire.dev/install.ps1 | iex',
    required: true,
  },
];

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

    const outdated = tool.minVersion !== undefined 
      && version !== 'installed' 
      && !meetsMinVersion(version, tool.minVersion);

    return { tool, installed: true, version, outdated };
  } catch {
    return { tool, installed: false, version: '', outdated: false };
  }
}

export function checkAllTools(): ToolStatus[] {
  return TOOLS.map(tool => checkTool(tool));
}

/**
 * Returns tools relevant for a specific project type with appropriate minVersion.
 * Both standalone and on-prem need all tools (Git, Node, Docker, .NET, Aspire).
 * SaaS replaces Aspire/.NET with Azure Functions.
 * 
 * minVersion is resolved per project type:
 * - .NET SDK: 10.0 for onprem/standalone (Aspire templates), 8.0 for saas
 */
export function getToolsForProjectType(projectType: ProjectType): ToolInfo[] {
  return TOOLS.map(tool => {
    if (tool.minVersionByProjectType?.[projectType]) {
      return {
        ...tool,
        minVersion: tool.minVersionByProjectType[projectType],
      };
    }
    return tool;
  });
}

/**
 * Checks tools for a specific project type, applying project-specific minVersion requirements.
 */
export function checkToolsForProjectType(projectType: ProjectType): ToolStatus[] {
  const tools = getToolsForProjectType(projectType);
  return tools.map(tool => checkTool(tool));
}

export function getInstallCommand(tool: ToolInfo): string {
  return isWindows ? tool.installWin : tool.installMac;
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
    name = execSync('git config user.name', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch { /* not configured */ }
  try {
    email = execSync('git config user.email', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch { /* not configured */ }
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
    const output = error instanceof Error && 'stdout' in error ? String((error as { stdout: string }).stdout) : '';
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
  } catch { /* ignore */ }

  // Check org membership
  try {
    const orgs = execSync('gh api user/orgs -q ".[].login"', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
      timeout: 10_000,
    });
    result.hasOrgAccess = orgs.split('\n').some(o => o.trim().toLowerCase() === org.toLowerCase());
  } catch { /* ignore */ }

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
