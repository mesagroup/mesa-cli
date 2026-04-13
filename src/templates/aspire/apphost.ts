import type { ScaffoldConfig } from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
  const isFullStack = config.projectType === 'standalone' && config.frontend === 'nextjs';
  const lines = [
    `import { createBuilder } from './.modules/aspire.js';`,
    ``,
    `const builder = await createBuilder();`,
    ``,
  ];

  // Database resource
  switch (config.database ?? 'sqlserver') {
    case 'postgresql': {
      lines.push(
        `// PostgreSQL container`,
        `const pg = await builder.addPostgres('pg');`,
        `const db = await pg.addDatabase('plugindb');`
      );
      break;
    }

    case 'mongodb': {
      lines.push(`// MongoDB container`, `const db = await builder.addMongoDB('mongo');`);
      break;
    }

    default: {
      lines.push(
        `// SQL Server container`,
        `const sql = await builder.addSqlServer('sql');`,
        `const db = await sql.addDatabase('plugindb');`
      );
      break;
    }
  }

  if (isFullStack) {
    // Standalone Next.js: single app at root, no separate backend
    lines.push(
      ``,
      `// Next.js app`,
      `const app = await builder`,
      `  .addJavaScriptApp('app', '.', { runScriptName: 'dev' })`,
      `  .withReference(db)`,
      `  .withHttpEndpoint({ port: 3000, env: 'PORT' });`
    );
  } else {
    // Monorepo or plugin: Express backend in ./backend
    lines.push(
      ``,
      `// Express backend`,
      `const api = await builder`,
      `  .addNodeApp('api', './backend', 'src/server.ts')`,
      `  .withReference(db)`,
      `  .withHttpEndpoint({ port: 3000, env: 'PORT' });`
    );

    if (config.includeFrontend) {
      const isStandalone = config.projectType === 'standalone';

      if (isStandalone && config.frontend === 'react-vite') {
        lines.push(
          ``,
          `// React + Vite frontend`,
          `await builder`,
          `  .addViteApp('web', './frontend')`,
          `  .withReference(api)`,
          `  .waitFor(api);`
        );
      } else {
        // Angular frontend (standalone or plugin types)
        lines.push(
          ``,
          `// Angular frontend`,
          `await builder`,
          `  .addJavaScriptApp('web', './frontend', { runScriptName: 'start' })`,
          `  .withReference(api)`,
          `  .withHttpEndpoint({ port: 4200, env: 'PORT' })`,
          `  .waitFor(api);`
        );
      }
    }
  }

  lines.push(``, `await builder.build().run();`, ``);

  return lines.join('\n');
}
