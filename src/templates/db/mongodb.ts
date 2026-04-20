import type { ScaffoldConfig } from '../../types/scaffold';

export function renderService(
  _config: ScaffoldConfig,
  context: 'express' | 'nextjs' = 'express'
): string {
  const envImport = context === 'nextjs' ? './env' : '../config/env';
  return `import { MongoClient, type Db } from 'mongodb';
import { env } from '${envImport}';

let client: MongoClient | null = null;

export async function getDb(): Promise<Db> {
  if (!client) {
    client = new MongoClient(env.MONGODB_URI);
    await client.connect();
    client.on('error', (err) => { console.error('[DB] Client error:', err.message); client = null; });
  }
  return client.db(env.DB_NAME);
}
`;
}

export function renderEnvSchema(config: ScaffoldConfig): string {
  const mongoUri =
    config.mongoMode === 'atlas'
      ? `  MONGODB_URI: z.string().min(1),`
      : `  MONGODB_URI: z.string().default('mongodb://localhost:27017'),
  ConnectionStrings__mongodb: z.string().optional(),`;

  return `${mongoUri}
  DB_NAME: z.string().default('appdb'),`;
}

export function renderEnvExample(config: ScaffoldConfig): string {
  const uri =
    config.mongoMode === 'atlas'
      ? 'MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/?retryWrites=true'
      : 'MONGODB_URI=mongodb://localhost:27017';

  return `# Database (MongoDB)
${uri}
DB_NAME=appdb`;
}

export function renderHealthCheck(_config: ScaffoldConfig): string {
  return `    const db = await getDb();
    await db.command({ ping: 1 });`;
}

export function getHealthCheckImport(context: 'express' | 'nextjs' = 'express'): string {
  const path = context === 'nextjs' ? '@/lib/db' : '../services/db';
  return `import { getDb } from '${path}';`;
}

export function getDependencies(): Record<string, string> {
  return { mongodb: '^6.12.0' };
}

export function getDevDependencies(): Record<string, string> {
  return {};
}
