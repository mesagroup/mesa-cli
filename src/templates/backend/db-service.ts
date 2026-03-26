import type { ScaffoldConfig } from '../../types/scaffold';

export function render(_config: ScaffoldConfig): string {
	return `import sql from 'mssql';
import { env } from '../config/env';

let pool: sql.ConnectionPool | null = null;

function buildConfig(): sql.config {
  // Prefer Aspire-style connection string if available
  const aspireConn = env.ConnectionStrings__sqldb;
  if (aspireConn) {
    return {
      connectionString: aspireConn,
      options: {
        trustServerCertificate: true,
      },
    } as unknown as sql.config;
  }

  const baseConfig: sql.config = {
    server: env.DB_SERVER,
    database: env.DB_NAME,
    options: {
      trustServerCertificate: true,
      encrypt: false,
    },
  };

  if (env.DB_TRUSTED_CONNECTION) {
    return {
      ...baseConfig,
      authentication: {
        type: 'ntlm',
        options: {
          domain: '',
          userName: '',
          password: '',
        },
      },
    } as sql.config;
  }

  return {
    ...baseConfig,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
  };
}

/**
 * Returns a lazily-initialized singleton connection pool.
 * All queries MUST use parameterized statements via pool.request().input().
 */
export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    const config = buildConfig();
    pool = await new sql.ConnectionPool(config).connect();
    pool.on('error', (err) => {
      console.error('[DB] Pool error:', err.message);
      pool = null;
    });
  }

  return pool;
}
`;
}
