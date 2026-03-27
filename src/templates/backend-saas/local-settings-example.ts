import type { ScaffoldConfig } from '../../types/scaffold';

export function render(_config: ScaffoldConfig): string {
	return JSON.stringify(
		{
			IsEncrypted: false,
			Values: {
				AzureWebJobsStorage: '',
				FUNCTIONS_WORKER_RUNTIME: 'node',
				DB_SERVER: '',
				DB_NAME: '',
				DB_USER: '',
				DB_PASSWORD: '',
				JWT_SECRET: '',
				JWT_ISSUER: '',
				JWT_AUDIENCE: '',
				CORS_ORIGINS: 'http://localhost:4200',
			},
		},
		null,
		2,
	);
}
