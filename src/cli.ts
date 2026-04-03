import meow from 'meow';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { initCommand } from './commands/init';
import { setupCommand } from './commands/setup';
import { isFirstRun, markSetupDone } from './util/first-run';

dotenv.config();

const cli = meow(
  `
  Usage
    $ mesa <command> [options]

  Commands
    init     Scaffold a new MESAPPA plugin or standalone PoC project
    setup    Check and install required development tools
    login    Login to your account and obtain an auth token

  Init Options
    --no-frontend  Skip Angular frontend generation
    --author       Author name (default: git config user.name)
    --description  Plugin description
    --dry-run      Show what would be created without writing files
    -y, --yes      Skip prompts, use defaults

  Login Options
    --tenant-id    The tenant ID to use for the login

  Examples
    $ mesa init
    $ mesa init my-plugin --no-frontend
    $ mesa setup
    $ mesa login --tenant-id=mesappa
`,
  {
    importMeta: import.meta,
    flags: {
      tenantId: { type: 'string' },
      frontend: { type: 'boolean', default: true },
      author: { type: 'string' },
      description: { type: 'string' },
      dryRun: { type: 'boolean', default: false },
      yes: { type: 'boolean', shortFlag: 'y', default: false },
    },
  }
);

async function main() {
  const [command, ...args] = cli.input;

  switch (command) {
    case 'setup': {
      await setupCommand();
      markSetupDone();
      break;
    }

    case 'init': {
      // First-run: auto-run setup before init
      if (isFirstRun() && process.stdin.isTTY) {
        console.log(chalk.blue('  First run detected — checking environment...\n'));
        await setupCommand();
        markSetupDone();
      }

      await initCommand(args[0], {
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
      const response = await client.login();
      console.log('Login successful:', response);
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
