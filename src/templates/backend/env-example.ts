import type { ScaffoldConfig } from '../../types/scaffold';
import { getDbModule } from '../db';

export function render(config: ScaffoldConfig): string {
  const db = getDbModule(config);
  return `# Server
PORT=3000
CORS_ORIGINS=http://localhost:4200

${db.renderEnvExample(config)}

# JWT Authentication
# Provide either JWT_SECRET (symmetric) or JWT_PUBLIC_KEY (asymmetric)
JWT_SECRET=your-secret-key-replace-me
# JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\\nMIIBI...\\n-----END PUBLIC KEY-----
JWT_ISSUER=your-issuer
JWT_AUDIENCE=your-audience
`;
}
