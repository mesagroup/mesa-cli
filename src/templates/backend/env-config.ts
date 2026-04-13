import type { ScaffoldConfig } from '../../types/scaffold';

export function render(_config: ScaffoldConfig): string {
  return `import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  CORS_ORIGINS: z.string().default('http://localhost:4200'),

  // Database
  DB_SERVER: z.string().min(1),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_TRUSTED_CONNECTION: z
    .string()
    .transform((v) => v.toLowerCase() === 'true')
    .default('false'),

  // JWT
  JWT_SECRET: z.string().optional(),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_ISSUER: z.string().optional(),
  JWT_AUDIENCE: z.string().optional(),

  // Aspire connection string
  ConnectionStrings__sqldb: z.string().optional(),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
`;
}
