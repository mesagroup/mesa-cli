import type { ScaffoldConfig } from '../../types/scaffold';

export function renderService(_config: ScaffoldConfig): string {
  return `import sql from 'mssql';
import { env } from '../config/env';

let pool: sql.ConnectionPool | null = null;

function buildConfig(): sql.config {
  const aspireConn = env.ConnectionStrings__sqldb;
  if (aspireConn) {
    return { connectionString: aspireConn, options: { trustServerCertificate: true } } as unknown as sql.config;
  }
  const baseConfig: sql.config = {
    server: env.DB_SERVER, database: env.DB_NAME,
    options: { trustServerCertificate: true, encrypt: false },
  };
  if (env.DB_TRUSTED_CONNECTION) {
    return { ...baseConfig, authentication: { type: 'ntlm', options: { domain: '', userName: '', password: '' } } } as sql.config;
  }
  return { ...baseConfig, user: env.DB_USER, password: env.DB_PASSWORD };
}

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    const config = buildConfig();
    pool = await new sql.ConnectionPool(config).connect();
    pool.on('error', (err) => { console.error('[DB] Pool error:', err.message); pool = null; });
  }
  return pool;
}
`;
}

export function renderEnvSchema(_config: ScaffoldConfig): string {
  return `  DB_SERVER: z.string().min(1),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_TRUSTED_CONNECTION: z.string().transform((v) => v.toLowerCase() === 'true').default('false'),
  ConnectionStrings__sqldb: z.string().optional(),`;
}

export function renderEnvExample(_config: ScaffoldConfig): string {
  return `# Database (SQL Server)
DB_SERVER=localhost
DB_NAME=MyDatabase
DB_USER=sa
DB_PASSWORD=YourStr0ngP@ssword
DB_TRUSTED_CONNECTION=false`;
}

export function renderHealthCheck(_config: ScaffoldConfig): string {
  return `    const pool = await getPool();
    await pool.request().query('SELECT 1');`;
}

export function getHealthCheckImport(): string {
  return `import { getPool } from '../services/db';`;
}

export function getDependencies(): Record<string, string> {
  return { mssql: '^11.0.1' };
}

export function getDevDependencies(): Record<string, string> {
  return {};
}
