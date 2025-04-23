#!/usr/bin/env node

import meow from 'meow';
import { Client } from './client';
import { Config } from './types';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const cli = meow(
  `
  Usage
    $ mesa <command> [options]

  Commands
    init    Initialize a new project
    deploy  Deploy your project
    status  Check deployment status

  Options
    --api-key     API key for authentication
    --base-url    Custom API base URL

  Examples
    $ mesa init
    $ mesa deploy --api-key=xxx
`,
  {
    importMeta: import.meta,
  }
);

const configSchema = z.object({
  apiKey: z.string().optional(),
  baseUrl: z.string().url().optional(),
});

async function main() {
  const config = configSchema.parse({
    apiKey: process.env.MESA_API_KEY || cli.flags.apiKey,
    baseUrl: process.env.MESA_BASE_URL || cli.flags.baseUrl,
  });

  const client = new Client({
    apiKey: config.apiKey || '',
    baseUrl: config.baseUrl,
  });

  const [command] = cli.input;

  switch (command) {
    case 'init':
      console.log('Initializing project...');
      break;
    case 'deploy':
      console.log('Deploying project...');
      break;
    case 'status':
      console.log('Checking status...');
      break;
    default:
      cli.showHelp();
  }
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
