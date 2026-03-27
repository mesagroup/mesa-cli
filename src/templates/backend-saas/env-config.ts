import type { ScaffoldConfig } from '../../types/scaffold';

export function render(_config: ScaffoldConfig): string {
	return [
		"import { z } from 'zod';",
		'',
		'// Azure Functions runtime populates process.env from App Settings',
		'// and local.settings.json during local development. No dotenv needed.',
		'',
		'const envSchema = z.object({',
		'  // Database',
		'  DB_SERVER: z.string().min(1),',
		'  DB_NAME: z.string().min(1),',
		'  DB_USER: z.string().min(1),',
		'  DB_PASSWORD: z.string().min(1),',
		'',
		'  // JWT',
		'  JWT_SECRET: z.string().optional(),',
		'  JWT_PUBLIC_KEY: z.string().optional(),',
		'  JWT_ISSUER: z.string().optional(),',
		'  JWT_AUDIENCE: z.string().optional(),',
		'',
		'  // CORS',
		"  CORS_ORIGINS: z.string().default('http://localhost:4200'),",
		'});',
		'',
		'export const env = envSchema.parse(process.env);',
		'export type Env = z.infer<typeof envSchema>;',
		'',
	].join('\n');
}
