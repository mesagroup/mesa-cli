import type { ScaffoldConfig } from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
  const dbFields = getDbFields(config.database, config.mongoMode);

  return `import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: '.env.local' });

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),

  // JWT
  JWT_SECRET: z.string().optional(),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_ISSUER: z.string().optional(),
  JWT_AUDIENCE: z.string().optional(),
${dbFields}});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
`;
}

function getDbFields(database?: string, mongoMode?: string): string {
  switch (database) {
    case 'sqlserver': {
      return `
  // SQL Server
  DB_SERVER: z.string().default('localhost'),
  DB_NAME: z.string().default('master'),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_TRUSTED_CONNECTION: z.string().default('false'),
  ConnectionStrings__sqldb: z.string().optional(),
`;
    }

    case 'postgresql': {
      return `
  // PostgreSQL
  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().default('5432'),
  DB_NAME: z.string().default('postgres'),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_SSL: z.string().default('false'),
  ConnectionStrings__postgresdb: z.string().optional(),
`;
    }

    case 'mongodb': {
      const lines = `
  // MongoDB
  MONGODB_URI: z.string()${mongoMode === 'atlas' ? '' : ".default('mongodb://localhost:27017')"},
  DB_NAME: z.string().default('app'),`;
      const connectionString =
        mongoMode === 'local' ? `\n  ConnectionStrings__mongodb: z.string().optional(),` : '';
      return lines + connectionString + '\n';
    }

    default: {
      return '';
    }
  }
}
