import type {ScaffoldConfig} from '../../types/scaffold';

function getBackendStack(config: ScaffoldConfig): string {
	if (config.projectType === 'saas') return 'Azure Functions v4 + TypeScript';
	return 'Express 4 + TypeScript';
}

function getDbStack(config: ScaffoldConfig): string {
	if (config.database === 'postgresql') return 'PostgreSQL (pg driver)';
	if (config.database === 'mongodb') return 'MongoDB (mongodb driver)';
	return 'SQL Server (mssql driver)';
}

function getFrontendStack(config: ScaffoldConfig): string {
	if (!config.includeFrontend) return 'None';
	if (config.frontend === 'react-vite') return 'React + Vite + Tailwind CSS';
	if (config.frontend === 'nextjs') return 'Next.js + Tailwind CSS (App Router)';
	return 'Angular 16 + Module Federation';
}

function getOrchestrator(config: ScaffoldConfig): string {
	if (config.projectType === 'saas') return 'Azure Functions Core Tools';
	if (config.database === 'mongodb' && config.mongoMode === 'atlas') return 'None (Atlas cloud)';
	return '.NET Aspire (TypeScript AppHost)';
}

function getBackendRules(config: ScaffoldConfig): string[] {
	const lines: string[] = [];

	if (config.projectType === 'saas') {
		lines.push(
			`- Function handlers are thin: parse input, call service, return response`,
			`- Business logic lives in \`services/\`, never in function files`,
			`- Register functions with \`app.http()\` (v4 programming model)`,
			`- Use \`pool.request().input()\` for ALL SQL parameters — never concatenate`,
		);
	} else {
		lines.push(
			`- Route handlers are thin: parse input, call service, return response`,
			`- Business logic lives in \`services/\`, never in route files`,
			`- Use \`helmet()\` middleware with default settings — do not disable protections`,
		);

		if (config.database === 'mongodb') {
			lines.push(`- Use MongoDB driver directly — no Mongoose. Validate with Zod schemas.`);
		} else if (config.database === 'postgresql') {
			lines.push(`- Use parameterized queries via \`pg\` — \`pool.query(sql, [params])\``);
		} else {
			lines.push(`- Use \`sql.input()\` for ALL SQL parameters — never concatenate user input`);
		}
	}

	lines.push(
		`- CORS: whitelist explicit origins from env vars — never use \`origin: '*'\` or \`origin: true\``,
		`- JWT verification via \`jose\`: validate issuer, audience, expiration on every protected route`,
		`- Validate all external inputs (body, query, params) with Zod schemas`,
		`- Error responses: \`{ error: string, details?: unknown }\` — never leak stack traces`,
	);

	return lines;
}

function getFrontendRules(config: ScaffoldConfig): string[] {
	if (!config.includeFrontend) return [];

	const lines: string[] = [];

	if (config.frontend === 'nextjs' || (config.projectType === 'standalone' && config.frontend === 'nextjs')) {
		lines.push(
			``,
			`### Frontend (Next.js)`,
			`- Use App Router with Server Components by default`,
			`- Add \`'use client'\` only where interactivity is required`,
			`- Use \`next/image\` for images and \`next/font\` for fonts`,
			`- Tailwind CSS for styling — no inline style objects`,
			`- Keep components focused: one responsibility per file`,
		);
	} else if (config.frontend === 'react-vite') {
		lines.push(
			``,
			`### Frontend (React + Vite)`,
			`- Functional components with hooks — no class components`,
			`- Tailwind CSS for styling — no inline style objects`,
			`- Keep components under 250 lines — split into sub-components`,
			`- Colocate tests next to components (\`Component.test.tsx\`)`,
		);
	} else {
		lines.push(
			``,
			`### Frontend (Angular 16)`,
			`- Keep \`public-api\` surface minimal — export only what host app consumes`,
			`- Module Federation for micro-frontend integration`,
			`- Lazy-load feature modules`,
			`- Proxy API requests via \`proxy.conf.js\` in dev`,
			`- One component, one responsibility — split at ~250 lines`,
		);
	}

	return lines;
}

export function render(config: ScaffoldConfig): string {
	const isFullStack = config.projectType === 'standalone' && config.frontend === 'nextjs';

	const lines = [
		`---`,
		`description: Senior developer guidance for ${config.pluginName}. Architecture, conventions, and implementation standards.`,
		`globs: "**/*.ts,**/*.tsx"`,
		`alwaysApply: false`,
		`---`,
		``,
		`# Senior Developer Agent`,
		``,
		`You are a senior TypeScript developer working on **${config.pluginName}**.`,
		``,
		`## Stack`,
		``,
		`- **Backend**: ${getBackendStack(config)}`,
		`- **Database**: ${getDbStack(config)}`,
		`- **Frontend**: ${getFrontendStack(config)}`,
		`- **Orchestration**: ${getOrchestrator(config)}`,
		``,
		`## Project Structure`,
		``,
	];

	if (isFullStack) {
		lines.push(
			`This is a Next.js full-stack app. API routes in \`src/app/api/\`, UI in \`src/app/\`,`,
			`shared logic in \`src/lib/\`. No separate backend/ or frontend/ directories.`,
		);
	} else if (config.projectType === 'saas') {
		lines.push(
			`Monorepo: \`backend/\` (Azure Functions), \`frontend/\` (Angular, optional), \`scripts/\`.`,
			`Functions in \`backend/src/functions/\`, business logic in \`backend/src/services/\`.`,
		);
	} else {
		lines.push(
			`Monorepo: \`backend/\` (Express API), \`frontend/\` (optional), \`scripts/\`, \`apphost.ts\` (Aspire).`,
			`Routes in \`backend/src/routes/\`, business logic in \`backend/src/services/\`.`,
		);
	}

	lines.push(
		``,
		`## Implementation Rules`,
		``,
		`### TypeScript`,
		`- Strict mode enabled — no \`any\` types, use \`unknown\` and narrow`,
		`- Use \`import type\` for type-only imports`,
		`- Validate all external data with Zod schemas before processing`,
		`- Max ~400 lines per file — split when approaching the limit`,
		``,
		`### Backend`,
		...getBackendRules(config),
		``,
		`### Security (non-negotiable)`,
		`- .env files are gitignored — only \`.env.example\` is committed (with placeholders)`,
		`- Never log tokens, passwords, or PII`,
		`- HTTPS in production — TLS termination at reverse proxy or platform level`,
	);

	if (config.database !== 'mongodb') {
		lines.push(`- ALL database queries must use parameterized inputs — zero exceptions`);
	}

	lines.push(...getFrontendRules(config));

	lines.push(
		``,
		`## Build & Run`,
		``,
	);

	if (isFullStack) {
		lines.push(
			`- Dev: \`npm run dev\``,
			`- Build: \`npm run build\` (next build)`,
			`- Lint: \`npm run lint\``,
		);
	} else {
		lines.push(
			`- Install: \`npm run install:all\``,
			`- Dev: \`npm run dev\``,
			`- Build: \`npm run build\``,
		);
	}

	if (config.projectType !== 'saas' && !(config.database === 'mongodb' && config.mongoMode === 'atlas')) {
		lines.push(`- Orchestrate locally: \`aspire run\` (starts DB + services + dashboard)`);
	}

	lines.push(``);

	return lines.join('\n');
}
