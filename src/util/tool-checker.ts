import { execSync } from 'node:child_process';

export interface ToolInfo {
  name: string;
  displayName: string;
  checkCommand: string;
  versionPattern?: RegExp;
  installMac: string;
  installWin: string;
  required: boolean;
}

export interface ToolStatus {
  tool: ToolInfo;
  installed: boolean;
  version: string;
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
    required: true,
  },
  {
    name: 'node',
    displayName: 'Node.js',
    checkCommand: 'node --version',
    versionPattern: /v([\d.]+)/,
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
    installMac: 'brew install --cask docker',
    installWin: 'winget install --id Docker.DockerDesktop',
    required: true,
  },
  {
    name: 'dotnet',
    displayName: '.NET SDK',
    checkCommand: 'dotnet --version',
    versionPattern: /([\d.]+)/,
    installMac: 'brew install dotnet',
    installWin: 'winget install --id Microsoft.DotNet.SDK.10',
    required: true,
  },
  {
    name: 'aspire',
    displayName: 'Aspire CLI',
    checkCommand: 'aspire --version',
    versionPattern: /([\d.]+)/,
    installMac: 'dotnet tool install -g aspire.cli',
    installWin: 'dotnet tool install -g aspire.cli',
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

export function getInstallCommand(tool: ToolInfo): string {
  return isWindows ? tool.installWin : tool.installMac;
}

export function getPlatformLabel(): string {
  return isWindows ? 'Windows' : 'macOS';
}
