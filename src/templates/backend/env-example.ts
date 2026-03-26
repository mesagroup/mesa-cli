import type { ScaffoldConfig } from '../../types/scaffold';

export function render(_config: ScaffoldConfig): string {
	return `# Server
PORT=3000
CORS_ORIGINS=http://localhost:4200

# Database (SQL Server)
DB_SERVER=localhost
DB_NAME=MyDatabase
DB_USER=sa
DB_PASSWORD=YourStr0ngP@ssword
DB_TRUSTED_CONNECTION=false

# JWT Authentication
# Provide either JWT_SECRET (symmetric) or JWT_PUBLIC_KEY (asymmetric)
JWT_SECRET=your-secret-key-replace-me
# JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\\nMIIBI...\\n-----END PUBLIC KEY-----
JWT_ISSUER=your-issuer
JWT_AUDIENCE=your-audience

# Aspire connection string (optional, overrides individual DB_* vars)
# ConnectionStrings__sqldb=Server=localhost;Database=MyDatabase;User Id=sa;Password=YourStr0ngP@ssword;TrustServerCertificate=True
`;
}
