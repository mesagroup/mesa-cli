import meow from 'meow';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { initCommand } from './commands/init';
import { setupCommand } from './commands/setup';
import { prototypeCommand } from './commands/prototype';
import { verifyCommand } from './commands/verify';
import { isFirstRun, markSetupDone } from './util/first-run';
import { printBanner } from './util/banner';

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
    init       Scaffold a new MESAPPA plugin or standalone PoC project
    prototype  Scaffold a Vercel + Next.js + Hono + Neon prototype monorepo
    verify     Audit a project against MESA architecture best practices
    setup      Check and install required development tools
    login      Login to your account and obtain an auth token

  Options
    -v, --version  Show version number
    --quiet        Suppress the MESA banner

  Init Options
    --type         Project type: onprem, saas, or standalone (default: onprem)
    --no-frontend  Skip Angular frontend generation
    --author       Author name (default: git config user.name)
    --description  Plugin description
    --dry-run      Show what would be created without writing files
    -y, --yes      Skip prompts, use defaults

  Prototype Options
    --author       Author name (default: git config user.name)
    --description  Project description
    --dry-run      Show what would be created without writing files
    -y, --yes      Skip prompts, use defaults

  Verify Options
    --cwd <dir>    Directory to verify (defaults to current working directory)
    --json         Emit machine-readable JSON (suppresses banner)
    --explain      Print the matched evidence for each check

  Login Options
    --tenant-id    The tenant ID to use for the login

  Setup Options
    -y, --yes      Auto-install missing tools without prompting

  Examples
    $ mesa init
    $ mesa init my-plugin --no-frontend
    $ mesa prototype my-app -y
    $ mesa verify --cwd ./my-app
    $ mesa setup -y
    $ mesa login --tenant-id=mesappa
`,
  {
    importMeta: import.meta,
    flags: {
      type: { type: 'string' },
      tenantId: { type: 'string' },
      frontend: { type: 'boolean', default: true },
      author: { type: 'string' },
      description: { type: 'string' },
      dryRun: { type: 'boolean', default: false },
      yes: { type: 'boolean', shortFlag: 'y', default: false },
      cwd: { type: 'string' },
      json: { type: 'boolean', default: false },
      explain: { type: 'boolean', default: false },
      quiet: { type: 'boolean', default: false },
    },
  }
);

async function main() {
  const [command, ...args] = cli.input;

  // Banner: skip for verify --json (machine output) and when --quiet / env disables it.
  const isJsonVerify = command === 'verify' && cli.flags.json;
  if (!isJsonVerify) {
    printBanner({ quiet: cli.flags.quiet, subtitle: 'Scaffolder & architecture toolkit' });
  }

  switch (command) {
    case 'setup': {
      await setupCommand({ yes: cli.flags.yes });
      markSetupDone();
      break;
    }

    case 'init': {
      // First-run: auto-run setup before init
      if (isFirstRun() && process.stdin.isTTY) {
        console.log(chalk.blue('  First run detected — checking environment...\n'));
        await setupCommand({ yes: cli.flags.yes });
        markSetupDone();
      }

      await initCommand(args[0], {
        type: cli.flags.type,
        noFrontend: !cli.flags.frontend,
        author: cli.flags.author,
        description: cli.flags.description,
        dryRun: cli.flags.dryRun,
        yes: cli.flags.yes,
      });
      break;
    }

    case 'prototype': {
      await prototypeCommand(args[0], {
        author: cli.flags.author,
        description: cli.flags.description,
        dryRun: cli.flags.dryRun,
        yes: cli.flags.yes,
      });
      break;
    }

    case 'verify': {
      const exitCode = await verifyCommand({
        cwd: cli.flags.cwd,
        json: cli.flags.json,
        explain: cli.flags.explain,
      });
      process.exit(exitCode);
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
