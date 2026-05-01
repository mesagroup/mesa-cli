import { execSync } from 'node:child_process';
import type { ProjectType } from '../types/scaffold';

export interface ToolInfo {
  name: string;
  displayName: string;
  checkCommand: string;
  versionPattern?: RegExp;
  installMac: string;
  installWin: string;
  installLinux?: string;
  installWinUserLevel?: string;
  installMacUserLevel?: string;
  installLinuxUserLevel?: string;
  autoInstallWin?: () => Promise<boolean>;
  autoInstallMac?: () => Promise<boolean>;
  autoInstallLinux?: () => Promise<boolean>;
  requiresAdmin?: boolean;
  adminAlternatives?: string[];
  required: boolean;
}

export interface ToolStatus {
  tool: ToolInfo;
  installed: boolean;
  version: string;
}

const isWindows = process.platform === 'win32';
const isLinux = process.platform === 'linux';
const isMac = process.platform === 'darwin';

async function installDotNetUserLevel(): Promise<boolean> {
  try {
    const installScript = isWindows
      ? 'powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri https://dot.net/v1/dotnet-install.ps1 -OutFile dotnet-install.ps1; ./dotnet-install.ps1 -Channel 10.0 -InstallDir $HOME/.dotnet; Remove-Item dotnet-install.ps1"'
      : 'curl -sSL https://dot.net/v1/dotnet-install.sh | bash /dev/stdin --channel 10.0 --install-dir $HOME/.dotnet';

    execSync(installScript, { stdio: 'inherit', timeout: 300_000 });

    if (isWindows) {
      const userPath = process.env.PATH ?? '';
      const dotnetPath = `${process.env.USERPROFILE}\\.dotnet`;
      if (!userPath.includes(dotnetPath)) {
        execSync(`setx PATH "${userPath};${dotnetPath}"`, { stdio: 'pipe' });
      }
    }

    return true;
  } catch {
    return false;
  }
}

async function installNodeUserLevel(): Promise<boolean> {
  try {
    if (isWindows) {
      execSync(
        'powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://fnm.vercel.app/install.ps1 | iex"',
        { stdio: 'inherit', timeout: 120_000 }
      );
      execSync('fnm install --lts', { stdio: 'inherit', timeout: 120_000 });
      execSync('fnm use lts-latest', { stdio: 'inherit', timeout: 30_000 });
    } else {
      execSync('curl -fsSL https://fnm.vercel.app/install | bash', {
        stdio: 'inherit',
        timeout: 120_000,
      });
      execSync('source ~/.bashrc && fnm install --lts && fnm use lts-latest', {
        stdio: 'inherit',
        timeout: 120_000,
        shell: '/bin/bash',
      });
    }
    return true;
  } catch {
    return false;
  }
}

async function installGitHubCLIUserLevel(): Promise<boolean> {
  try {
    if (isWindows) {
      execSync('winget install --id GitHub.cli --scope user', {
        stdio: 'inherit',
        timeout: 120_000,
      });
    } else {
      execSync('brew install gh', { stdio: 'inherit', timeout: 120_000 });
    }
    return true;
  } catch {
    return false;
  }
}

async function installAspireUserLevel(): Promise<boolean> {
  try {
    const installScript = isWindows
      ? 'powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://aspire.dev/install.ps1 | iex"'
      : 'curl -sSL https://aspire.dev/install.sh | bash';

    execSync(installScript, { stdio: 'inherit', timeout: 300_000 });
    return true;
  } catch {
    return false;
  }
}

async function installGitUserLevel(): Promise<boolean> {
  try {
    if (isWindows) {
      execSync('winget install --id Git.Git', {
        stdio: 'inherit',
        timeout: 120_000,
      });
    } else if (isLinux) {
      execSync('sudo apt-get update && sudo apt-get install -y git', {
        stdio: 'inherit',
        timeout: 300_000,
      });
    } else {
      execSync('brew install git', { stdio: 'inherit', timeout: 120_000 });
    }
    return true;
  } catch {
    return false;
  }
}

async function installNodeLinux(): Promise<boolean> {
  try {
    // Use NodeSource setup script for Node 20 LTS.
    execSync(
      'curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs',
      { stdio: 'inherit', timeout: 300_000, shell: '/bin/bash' }
    );
    return true;
  } catch {
    return false;
  }
}

async function installGitHubCLILinux(): Promise<boolean> {
  try {
    execSync(
      `(type -p wget >/dev/null || sudo apt-get install -y wget) \
&& sudo mkdir -p -m 755 /etc/apt/keyrings \
&& wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
&& sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
&& echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
&& sudo apt-get update && sudo apt-get install -y gh`,
      { stdio: 'inherit', timeout: 300_000, shell: '/bin/bash' }
    );
    return true;
  } catch {
    return false;
  }
}

async function installDockerLinux(): Promise<boolean> {
  try {
    execSync('curl -fsSL https://get.docker.com | sh', {
      stdio: 'inherit',
      timeout: 600_000,
      shell: '/bin/bash',
    });
    return true;
  } catch {
    return false;
  }
}

async function installDotNetLinux(): Promise<boolean> {
  try {
    execSync(
      'curl -sSL https://dot.net/v1/dotnet-install.sh | bash /dev/stdin --channel 10.0 --install-dir $HOME/.dotnet',
      { stdio: 'inherit', timeout: 600_000, shell: '/bin/bash' }
    );
    return true;
  } catch {
    return false;
  }
}

async function installAspireLinux(): Promise<boolean> {
  try {
    execSync('curl -sSL https://aspire.dev/install.sh | bash', {
      stdio: 'inherit',
      timeout: 300_000,
      shell: '/bin/bash',
    });
    return true;
  } catch {
    return false;
  }
}

export const TOOLS: ToolInfo[] = [
  {
    name: 'git',
    displayName: 'Git',
    checkCommand: 'git --version',
    versionPattern: /git version ([\d.]+)/,
    installMac: 'brew install git',
    installWin: 'winget install --id Git.Git',
    installLinux: 'sudo apt-get update && sudo apt-get install -y git',
    installWinUserLevel: 'winget install --id Git.Git',
    installMacUserLevel: 'brew install git',
    autoInstallWin: installGitUserLevel,
    autoInstallMac: installGitUserLevel,
    autoInstallLinux: installGitUserLevel,
    required: true,
  },
  {
    name: 'node',
    displayName: 'Node.js',
    checkCommand: 'node --version',
    versionPattern: /v([\d.]+)/,
    installMac: 'brew install node',
    installWin: 'winget install --id OpenJS.NodeJS.LTS',
    installLinux:
      'curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs',
    installWinUserLevel:
      'irm https://fnm.vercel.app/install.ps1 | iex; fnm install --lts; fnm use lts-latest',
    installMacUserLevel:
      'curl -fsSL https://fnm.vercel.app/install | bash && source ~/.bashrc && fnm install --lts && fnm use lts-latest',
    installLinuxUserLevel:
      'curl -fsSL https://fnm.vercel.app/install | bash && source ~/.bashrc && fnm install --lts && fnm use lts-latest',
    autoInstallWin: installNodeUserLevel,
    autoInstallMac: installNodeUserLevel,
    autoInstallLinux: installNodeLinux,
    required: true,
  },
  {
    name: 'gh',
    displayName: 'GitHub CLI',
    checkCommand: 'gh --version',
    versionPattern: /gh version ([\d.]+)/,
    installMac: 'brew install gh',
    installWin: 'winget install --id GitHub.cli',
    installLinux:
      'sudo apt-get update && sudo apt-get install -y gh || (curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/etc/apt/keyrings/githubcli-archive-keyring.gpg && sudo apt-get update && sudo apt-get install -y gh)',
    installWinUserLevel: 'winget install --id GitHub.cli --scope user',
    installMacUserLevel: 'brew install gh',
    autoInstallWin: installGitHubCLIUserLevel,
    autoInstallMac: installGitHubCLIUserLevel,
    autoInstallLinux: installGitHubCLILinux,
    required: false,
  },
  {
    name: 'docker',
    displayName: 'Docker',
    checkCommand: 'docker --version',
    versionPattern: /Docker version ([\d.]+)/,
    installMac: 'brew install --cask docker',
    installWin: 'winget install --id Docker.DockerDesktop',
    installLinux: 'curl -fsSL https://get.docker.com | sh',
    autoInstallLinux: installDockerLinux,
    requiresAdmin: true,
    adminAlternatives: [
      'Docker is optional — only needed for projects scaffolded with local DB containers',
      'Ask your IT department to install Docker Desktop',
      'Check if Docker is available in your corporate software portal',
      'Alternative: install Podman Desktop (may work without admin): winget install RedHat.Podman-Desktop',
    ],
    // Docker is optional: many MESA workflows (SaaS, prototype with Neon) don't need it.
    required: false,
  },
  {
    name: 'dotnet',
    displayName: '.NET SDK',
    checkCommand: 'dotnet --version',
    versionPattern: /([\d.]+)/,
    installMac: 'brew install dotnet',
    installWin: 'winget install --id Microsoft.DotNet.SDK.10',
    installLinux:
      'curl -sSL https://dot.net/v1/dotnet-install.sh | bash /dev/stdin --channel 10.0 --install-dir $HOME/.dotnet',
    installWinUserLevel:
      'powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri https://dot.net/v1/dotnet-install.ps1 -OutFile dotnet-install.ps1; ./dotnet-install.ps1 -Channel 10.0 -InstallDir $HOME/.dotnet"',
    installMacUserLevel:
      'curl -sSL https://dot.net/v1/dotnet-install.sh | bash /dev/stdin --channel 10.0 --install-dir $HOME/.dotnet',
    installLinuxUserLevel:
      'curl -sSL https://dot.net/v1/dotnet-install.sh | bash /dev/stdin --channel 10.0 --install-dir $HOME/.dotnet',
    autoInstallWin: installDotNetUserLevel,
    autoInstallMac: installDotNetUserLevel,
    autoInstallLinux: installDotNetLinux,
    required: false,
  },
  {
    name: 'aspire',
    displayName: 'Aspire CLI',
    checkCommand: 'aspire --version',
    versionPattern: /([\d.]+)/,
    installMac: 'curl -sSL https://aspire.dev/install.sh | bash',
    installWin: 'irm https://aspire.dev/install.ps1 | iex',
    installLinux: 'curl -sSL https://aspire.dev/install.sh | bash',
    installWinUserLevel: 'irm https://aspire.dev/install.ps1 | iex',
    installMacUserLevel: 'curl -sSL https://aspire.dev/install.sh | bash',
    installLinuxUserLevel: 'curl -sSL https://aspire.dev/install.sh | bash',
    autoInstallWin: installAspireUserLevel,
    autoInstallMac: installAspireUserLevel,
    autoInstallLinux: installAspireLinux,
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

    return { tool, installed: true, version };
  } catch {
    return { tool, installed: false, version: '' };
  }
}

export function checkAllTools(): ToolStatus[] {
  return TOOLS.map(tool => checkTool(tool));
}

/**
 * Returns tools relevant for a specific project type.
 * Both standalone and on-prem need all tools (Git, Node, Docker, .NET, Aspire).
 * SaaS replaces Aspire/.NET with Azure Functions.
 */
export function getToolsForProjectType(projectType: ProjectType): ToolInfo[] {
  return TOOLS;
}

export function isAdmin(): boolean {
  if (isWindows) {
    try {
      execSync('net session', { stdio: 'ignore', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  return process.getuid?.() === 0;
}

export function getInstallCommand(tool: ToolInfo, preferUserLevel = false): string {
  const hasAdmin = isAdmin();

  if (preferUserLevel || !hasAdmin) {
    let userLevelCmd: string | undefined;
    if (isWindows) userLevelCmd = tool.installWinUserLevel;
    else if (isLinux) userLevelCmd = tool.installLinuxUserLevel;
    else if (isMac) userLevelCmd = tool.installMacUserLevel;

    if (userLevelCmd) {
      return userLevelCmd;
    }
  }

  if (isWindows) return tool.installWin;
  if (isLinux) return tool.installLinux ?? '';
  return tool.installMac;
}

export function getPlatformLabel(): string {
  if (isWindows) return 'Windows';
  if (isLinux) return 'Linux';
  return 'macOS';
}

export function canAutoInstall(tool: ToolInfo): boolean {
  if (isWindows) return Boolean(tool.autoInstallWin);
  if (isLinux) return Boolean(tool.autoInstallLinux);
  return Boolean(tool.autoInstallMac);
}

export async function autoInstallTool(tool: ToolInfo): Promise<boolean> {
  let installer: (() => Promise<boolean>) | undefined;
  if (isWindows) installer = tool.autoInstallWin;
  else if (isLinux) installer = tool.autoInstallLinux;
  else if (isMac) installer = tool.autoInstallMac;

  if (!installer) {
    return false;
  }

  try {
    return await installer();
  } catch {
    return false;
  }
}

/**
 * Attempt to install a tool. Tries the platform-specific auto-installer first;
 * if absent, falls back to executing `getInstallCommand(tool)` via the system shell.
 *
 * Set MESA_AUTO_INSTALL=0 in the environment to force-disable shell fallback
 * (only the typed auto-installers will run). Useful for sandboxed environments.
 */
export async function runInstallCommand(tool: ToolInfo): Promise<boolean> {
  if (canAutoInstall(tool)) {
    return autoInstallTool(tool);
  }

  if (process.env.MESA_AUTO_INSTALL === '0') {
    return false;
  }

  const cmd = getInstallCommand(tool);
  if (!cmd) return false;

  try {
    execSync(cmd, {
      stdio: 'inherit',
      timeout: 600_000,
      shell: isWindows ? undefined : '/bin/bash',
    });
    return true;
  } catch {
    return false;
  }
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
