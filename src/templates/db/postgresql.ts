import type { ScaffoldConfig } from '../../types/scaffold';

export function renderService(_config: ScaffoldConfig): string {
  return `import { Pool } from 'pg';
import { env } from '../config/env';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      ssl: env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });
    pool.on('error', (err) => { console.error('[DB] Pool error:', err.message); pool = null; });
  }
  return pool;
}
`;
}

export function renderEnvSchema(_config: ScaffoldConfig): string {
  return `  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_SSL: z.string().default('false'),
  ConnectionStrings__postgresdb: z.string().optional(),`;
}

export function renderEnvExample(_config: ScaffoldConfig): string {
  return `# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=appdb
DB_USER=postgres
DB_PASSWORD=YourStr0ngP@ssword
DB_SSL=false
# DATABASE_URL=postgresql://postgres:YourStr0ngP@ssword@localhost:5432/appdb`;
}

export function renderHealthCheck(_config: ScaffoldConfig): string {
  return `    const pool = getPool();
    await pool.query('SELECT 1');`;
}

export function getHealthCheckImport(): string {
  return `import { getPool } from '../services/db';`;
}

export function getDependencies(): Record<string, string> {
  return { pg: '^8.13.0' };
}

export function getDevDependencies(): Record<string, string> {
  return { '@types/pg': '^8.11.0' };
}
