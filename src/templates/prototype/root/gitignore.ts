import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function render(_config: PrototypeConfig): string {
  return `# Environment
.env
.env.local
.env.*.local
.env.production
.env.preview

# Dependencies
node_modules/
.pnpm-store/

# Build output
.next/
dist/
build/
out/
.turbo/

# Vercel
.vercel/

# Drizzle
drizzle/

# Logs
*.log
.npm/
.pnpm-debug.log*

# OS files
.DS_Store
Thumbs.db
`;
}
