import type {ScaffoldConfig} from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
	const dbImport = getDbImport(config.database);
	const dbCheck = getDbHealthCheck(config.database, config.mongoMode);

	return `import { NextResponse } from 'next/server';
${dbImport}
export async function GET() {
  try {
${dbCheck}
    return NextResponse.json({ status: 'ok', db: 'connected' });
  } catch {
    return NextResponse.json(
      { status: 'degraded', db: 'disconnected' },
      { status: 503 },
    );
  }
}
`;
}

function getDbImport(database?: string): string {
	switch (database) {
		case 'sqlserver': {
			return `import sql from 'mssql';
import { env } from '@/lib/env';
`;
		}

		case 'postgresql': {
			return `import { Pool } from 'pg';
import { env } from '@/lib/env';
`;
		}

		case 'mongodb': {
			return `import { MongoClient } from 'mongodb';
import { env } from '@/lib/env';
`;
		}

		default: {
			return '';
		}
	}
}

function getDbHealthCheck(database?: string, mongoMode?: string): string {
	switch (database) {
		case 'sqlserver': {
			return `    const pool = await sql.connect({
      server: env.DB_SERVER,
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      options: { encrypt: true, trustServerCertificate: true },
    });
    await pool.request().query('SELECT 1');
    await pool.close();`;
		}

		case 'postgresql': {
			return `    const pool = new Pool({ connectionString: env.DATABASE_URL });
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    await pool.end();`;
		}

		case 'mongodb': {
			const uri = mongoMode === 'atlas'
				? 'env.MONGODB_URI'
				: "env.MONGODB_URI ?? 'mongodb://localhost:27017'";
			return `    const client = new MongoClient(${uri});
    await client.connect();
    await client.db(env.DB_NAME).command({ ping: 1 });
    await client.close();`;
		}

		default: {
			return '    // No database configured';
		}
	}
}
