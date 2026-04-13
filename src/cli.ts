import meow from 'meow';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { input, password } from '@inquirer/prompts';
import { initCommand } from './commands/init';
import { setupCommand } from './commands/setup';
import type { LoginCredentials } from './types';
import type { ProjectType } from './types/scaffold';

dotenv.config();

// Support -v as shorthand for --version (meow handles --version automatically)
if (process.argv.includes('-v')) {
  process.argv[process.argv.indexOf('-v')] = '--version';
}

const cli = meow(
  `
  Usage
    $ mesa <command> [options]

  Commands
    init     Scaffold a new MESAPPA plugin or standalone PoC project
    setup    Check and install required development tools
    login    Login to your account and obtain an auth token

  Options
    -v, --version  Show version number

  Init Options
    --type         Project type: onprem, saas, or standalone (default: onprem)
    --no-frontend  Skip Angular frontend generation
    --author       Author name (default: git config user.name)
    --description  Plugin description
    --dry-run      Show what would be created without writing files
    -y, --yes      Skip prompts, use defaults

  Login Options
    --tenant-id    The tenant ID to use for the login
    --username     Username for password-grant login
    --password     Password for password-grant login

  Examples
    $ mesa init
    $ mesa init my-plugin --no-frontend
    $ mesa setup
    $ mesa login --tenant-id=mesappa
`,
  {
    importMeta: import.meta,
    flags: {
      type: { type: 'string' },
      tenantId: { type: 'string' },
      username: { type: 'string' },
      password: { type: 'string' },
      frontend: { type: 'boolean', default: true },
      author: { type: 'string' },
      description: { type: 'string' },
      dryRun: { type: 'boolean', default: false },
      yes: { type: 'boolean', shortFlag: 'y', default: false },
    },
  }
);

const VALID_PROJECT_TYPES: ProjectType[] = ['onprem', 'saas', 'standalone'];

function parseProjectType(value?: string): ProjectType | undefined {
  if (!value) {
    return undefined;
  }

  if (!VALID_PROJECT_TYPES.includes(value as ProjectType)) {
    throw new Error(
      `Invalid project type "${value}". Must be one of: ${VALID_PROJECT_TYPES.join(', ')}`
    );
  }

  return value as ProjectType;
}

async function resolveLoginCredentials(flags: {
  username?: string;
  password?: string;
}): Promise<LoginCredentials> {
  let username = flags.username;
  let passwordValue = flags.password;

  if (!process.stdin.isTTY) {
    if (!username || !passwordValue) {
      throw new Error('Login requires --username and --password when stdin is not interactive');
    }

    return { username, password: passwordValue };
  }

  if (!username) {
    username = await input({ message: 'Username:' });
  }

  if (!passwordValue) {
    passwordValue = await password({ message: 'Password:' });
  }

  return { username, password: passwordValue };
}

async function main() {
  const [command, ...args] = cli.input;
  const projectType = parseProjectType(cli.flags.type);

  switch (command) {
    case 'setup': {
      const setupOk = await setupCommand(projectType);
      if (setupOk) {
        const { markSetupDone } = await import('./util/first-run');
        markSetupDone();
      }
      break;
    }

    case 'init': {
      await initCommand(args[0], {
        type: projectType,
        noFrontend: !cli.flags.frontend,
        author: cli.flags.author,
        description: cli.flags.description,
        dryRun: cli.flags.dryRun,
        yes: cli.flags.yes,
      });
      break;
    }

    case 'login': {
      const { ClientSDK } = await import('./client/client');
      const tenantId = cli.flags.tenantId ?? process.env.MESA_INSTANCE ?? 'default';
      const client = new ClientSDK({
        client: {
          tenantId,
          baseUrl: process.env.MESA_BASE_URL,
        },
      });
      const credentials = await resolveLoginCredentials({
        username: cli.flags.username,
        password: cli.flags.password,
      });
      const response = await client.login(credentials);
      console.log(chalk.green('Login successful.'));
      console.log(response.access_token);
      break;
    }

    default:
      cli.showHelp();
  }
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
