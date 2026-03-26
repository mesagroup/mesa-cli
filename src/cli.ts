import meow from 'meow';
import dotenv from 'dotenv';
import { initCommand } from './commands/init';

dotenv.config();

const cli = meow(
  `
  Usage
    $ mesa <command> [options]

  Commands
    init     Scaffold a new MESAPPA plugin project
    login    Login to your account and obtain an auth token

  Init Options
    --no-frontend  Skip Angular frontend generation
    --author       Author name (default: git config user.name)
    --dry-run      Show what would be created without writing files

  Login Options
    --tenant-id    The tenant ID to use for the login

  Examples
    $ mesa init my-plugin
    $ mesa init my-plugin --no-frontend
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
    case 'init': {
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
      // Lazy-load client only for commands that need it
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
