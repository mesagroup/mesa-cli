import type { ScaffoldConfig } from '../../types/scaffold';
import { getDbModule } from '../db';

export function render(config: ScaffoldConfig): string {
  const db = getDbModule(config);
  return `import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  CORS_ORIGINS: z.string().default('http://localhost:4200'),

  // Database
${db.renderEnvSchema(config)}

  // JWT
  JWT_SECRET: z.string().optional(),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_ISSUER: z.string().optional(),
  JWT_AUDIENCE: z.string().optional(),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
`;
}
