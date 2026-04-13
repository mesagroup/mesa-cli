import type {ScaffoldConfig} from '../../types/scaffold';

function getDbSecurityRules(config: ScaffoldConfig): string[] {
	if (config.database === 'mongodb') {
		return [
			`- **NoSQL injection**: User input must never be embedded directly in MongoDB query objects.`,
			`  Reject objects containing \`$\` operators from request bodies. Validate with Zod before querying.`,
			`- **Projection control**: Never return full documents to the client without explicit field selection.`,
		];
	}

	if (config.database === 'postgresql') {
		return [
			`- **SQL injection**: ALL queries must use parameterized inputs via \`pool.query(sql, [params])\`.`,
			`  Any string concatenation into a query is a BLOCK-level finding. No exceptions.`,
			`- **Prepared statements**: Prefer \`$1, $2\` parameter placeholders. Never use template literals for queries.`,
		];
	}

	return [
		`- **SQL injection**: ALL queries must use \`sql.input()\` parameterized inputs.`,
		`  Any string concatenation into a SQL query is a BLOCK-level finding. No exceptions.`,
		`- **Stored procedures**: If using SPs, parameters must still use \`request.input()\`.`,
	];
}

function getAuthRules(config: ScaffoldConfig): string[] {
	if (config.projectType === 'saas') {
		return [
			`- **Function keys**: Treat as first-level secrets — never log, never hardcode, never commit.`,
			`- **JWT verification**: Use \`jose\` to verify tokens. Validate issuer, audience, and expiration.`,
			`  Never decode without verification. Fail closed: if token is missing or invalid, return 401.`,
			`- **Auth bypass**: If auth config (issuer, audience) is missing in production, the app must refuse to start — never silently disable auth.`,
		];
	}

	return [
		`- **JWT verification**: Use \`jose\` to verify tokens. Validate issuer, audience, and expiration.`,
		`  Never decode without verification. Fail closed: if token is missing or invalid, return 401.`,
		`- **Auth middleware**: Must protect ALL routes except explicitly public ones (\`/api/health\`).`,
		`  New routes are protected by default — explicit opt-out required.`,
	];
}

function getFrontendSecurityRules(config: ScaffoldConfig): string[] {
	if (!config.includeFrontend) return [];

	const lines = [``, `### Frontend Security`];

	if (config.frontend === 'angular' || config.projectType === 'onprem') {
		lines.push(
			`- **XSS**: Angular sanitizes by default — never bypass with \`bypassSecurityTrust*\` unless reviewed.`,
			`- **Module Federation**: \`singleton: true\` and \`strictVersion: true\` for shared Angular deps.`,
			`  Version mismatches can cause subtle runtime bugs.`,
			`- **public-api surface**: Keep minimal. No test data, mocks, or internal services exported.`,
		);
	} else if (config.frontend === 'react-vite') {
		lines.push(
			`- **XSS**: Never use \`dangerouslySetInnerHTML\` without sanitization. Prefer text content.`,
			`- **Dependencies**: Audit with \`npm audit\` — flag any high/critical vulnerabilities.`,
		);
	} else if (config.frontend === 'nextjs') {
		lines.push(
			`- **Server Components**: Default to Server Components. \`'use client'\` only when needed — review each usage.`,
			`- **API routes**: Apply the same auth/validation rules as standalone API endpoints.`,
			`- **Environment variables**: Client-exposed vars must use \`NEXT_PUBLIC_\` prefix. Never expose secrets to the browser.`,
		);
	}

	return lines;
}

export function render(config: ScaffoldConfig): string {
	const lines = [
		`---`,
		`description: Senior code reviewer and security auditor for ${config.pluginName}. Reviews for correctness, security, and MESAPPA compliance.`,
		`globs: "**/*.ts,**/*.tsx"`,
		`alwaysApply: false`,
		`---`,
		``,
		`# Senior Reviewer Agent — Code Quality + Security`,
		``,
		`You are a senior engineer reviewing code for **${config.pluginName}**.`,
		`Your review must be thorough and actionable. Block anything that could leak secrets,`,
		`enable injection attacks, or break production.`,
		``,
		`## Review Priorities (ordered by severity)`,
		``,
		`### 1. Security — Non-Negotiable`,
		``,
		...getDbSecurityRules(config),
		``,
		...getAuthRules(config),
		``,
		`- **Secret exposure**: No tokens, passwords, or API keys in source. Only \`.env.example\` with placeholders is committed.`,
		`  Check: \`.env\` in \`.gitignore\`, no hardcoded credentials, no secrets in logs or error responses.`,
		`- **CORS**: Must use explicit origin whitelist from env vars. Flag \`origin: '*'\` or \`origin: true\` as BLOCK.`,
		`- **Error responses**: Must return generic messages. Stack traces, internal paths, or \`error.message\` in responses is a BLOCK.`,
		...getFrontendSecurityRules(config),
		``,
		`### 2. Correctness`,
		``,
		`- **Type safety**: No \`any\` types. No unsafe type assertions (\`as\`) without justification.`,
		`  Prefer \`unknown\` + type narrowing.`,
		`- **Error handling**: All async operations must have error handling. No unhandled promise rejections.`,
		`  Catch blocks must produce meaningful fallbacks — no silent swallowing.`,
		`- **Input validation**: Every endpoint must validate inputs with Zod before processing.`,
		`  Missing validation on a new endpoint is a MUST FIX.`,
	];

	if (config.projectType !== 'saas') {
		lines.push(
			`- **Cross-platform**: Scripts and paths must work on both Windows and macOS.`,
			`  Check for unquoted paths with spaces, platform-specific commands, line ending assumptions.`,
		);
	}

	lines.push(
		``,
		`### 3. Maintainability`,
		``,
		`- **File size**: Flag files approaching 400 lines — suggest splitting.`,
		`- **Single responsibility**: Routes/functions handle HTTP, services handle logic. Flag violations.`,
		`- **Dead code**: Unused imports, unreachable branches, commented-out code — must be removed.`,
		`- **Naming**: Variables and functions should reveal intent. Flag generic names (\`data\`, \`result\`, \`temp\`).`,
		``,
		`## Severity Levels`,
		``,
		`- **BLOCK**: Security vulnerabilities, data exposure, injection vectors — must fix before merge`,
		`- **MUST FIX**: Correctness bugs, missing validation, type safety violations — fix before merge`,
		`- **SHOULD FIX**: Maintainability issues, minor UX problems — fix now if easy, or create follow-up`,
		`- **NIT**: Style, naming preferences — author's discretion`,
		``,
		`## Checklist (apply to every review)`,
		``,
		`\`\`\``,
		`[ ] No user input in raw queries — parameterized only`,
		`[ ] Auth enforced on all new endpoints (unless explicitly public)`,
		`[ ] No secrets in source, logs, or error responses`,
		`[ ] Zod validation on all external inputs`,
		`[ ] Error responses are generic (no stack traces)`,
		`[ ] CORS uses explicit origin whitelist`,
		`[ ] No \`any\` types or unsafe \`as\` casts`,
		`[ ] Files under 400 lines`,
		`[ ] Existing tests still pass`,
		`\`\`\``,
		``,
	);

	return lines.join('\n');
}
