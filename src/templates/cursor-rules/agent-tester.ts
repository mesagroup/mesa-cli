import type {ScaffoldConfig} from '../../types/scaffold';

function getTestStack(config: ScaffoldConfig): string[] {
	const lines: string[] = [];

	if (config.projectType === 'saas') {
		lines.push(
			`- **Backend**: vitest for unit tests on Azure Functions handlers and services`,
			`- **Integration**: Azure Functions Core Tools for local function testing`,
		);
	} else if (config.projectType === 'standalone' && config.frontend === 'nextjs') {
		lines.push(
			`- **Unit/Integration**: vitest for API routes, services, and utility functions`,
			`- **Components**: React Testing Library + vitest for UI components`,
		);
	} else {
		lines.push(
			`- **Backend**: vitest for Express route handlers and services`,
			`- **Integration**: supertest for HTTP-level endpoint testing`,
		);
	}

	if (config.includeFrontend && config.frontend === 'angular') {
		lines.push(`- **Frontend**: Karma + Jasmine (Angular CLI default)`);
	} else if (config.includeFrontend && config.frontend === 'react-vite') {
		lines.push(`- **Frontend**: vitest + React Testing Library`);
	}

	return lines;
}

function getDbMocking(config: ScaffoldConfig): string[] {
	if (config.database === 'mongodb') {
		return [
			`### Mocking MongoDB`,
			``,
			`\`\`\`typescript`,
			`// Mock the MongoDB client at module boundary`,
			`const mockCollection = {`,
			`  find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),`,
			`  insertOne: vi.fn().mockResolvedValue({ insertedId: 'mock-id' }),`,
			`  updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),`,
			`  deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),`,
			`};`,
			``,
			`vi.mock('../services/db', () => ({`,
			`  getDb: vi.fn(() => ({`,
			`    collection: vi.fn(() => mockCollection),`,
			`  })),`,
			`}));`,
			`\`\`\``,
		];
	}

	if (config.database === 'postgresql') {
		return [
			`### Mocking PostgreSQL`,
			``,
			`\`\`\`typescript`,
			`// Mock the pg pool at module boundary`,
			`const mockQuery = vi.fn().mockResolvedValue({ rows: [], rowCount: 0 });`,
			``,
			`vi.mock('../services/db', () => ({`,
			`  pool: { query: mockQuery },`,
			`}));`,
			``,
			`// Per-test: set expected results`,
			`mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, name: 'Test' }], rowCount: 1 });`,
			`\`\`\``,
		];
	}

	return [
		`### Mocking SQL Server`,
		``,
		`\`\`\`typescript`,
		`// Mock the mssql connection pool at module boundary`,
		`const mockInput = vi.fn().mockReturnThis();`,
		`const mockQuery = vi.fn().mockResolvedValue({ recordset: [], rowsAffected: [0] });`,
		`const mockRequest = { input: mockInput, query: mockQuery };`,
		``,
		`vi.mock('../services/db', () => ({`,
		`  getPool: vi.fn(() => ({`,
		`    request: vi.fn(() => mockRequest),`,
		`  })),`,
		`}));`,
		``,
		`// Per-test: set expected results`,
		`mockQuery.mockResolvedValueOnce({`,
		`  recordset: [{ id: 1, name: 'Test' }],`,
		`  rowsAffected: [1],`,
		`});`,
		`\`\`\``,
	];
}

function getAuthMocking(config: ScaffoldConfig): string[] {
	if (config.projectType === 'saas') {
		return [
			`### Mocking Auth (Azure Functions)`,
			``,
			`\`\`\`typescript`,
			`// Create a mock HttpRequest with auth header`,
			`function mockRequest(overrides = {}) {`,
			`  return {`,
			`    method: 'GET',`,
			`    url: 'http://localhost/api/test',`,
			`    headers: new Headers({ authorization: 'Bearer mock-jwt-token' }),`,
			`    ...overrides,`,
			`  };`,
			`}`,
			``,
			`// Mock jose verification to skip real JWT validation in tests`,
			`vi.mock('jose', () => ({`,
			`  jwtVerify: vi.fn().mockResolvedValue({`,
			`    payload: { sub: 'user-123', iss: 'test-issuer', aud: 'test-audience' },`,
			`  }),`,
			`}));`,
			`\`\`\``,
		];
	}

	return [
		`### Mocking Auth (Express JWT)`,
		``,
		`\`\`\`typescript`,
		`// Mock jose verification to bypass real JWT in tests`,
		`vi.mock('jose', () => ({`,
		`  jwtVerify: vi.fn().mockResolvedValue({`,
		`    payload: { sub: 'user-123', iss: 'test-issuer', aud: 'test-audience' },`,
		`  }),`,
		`}));`,
		``,
		`// For supertest integration tests, add auth header`,
		`const agent = request(app)`,
		`  .get('/api/resource')`,
		`  .set('Authorization', 'Bearer mock-jwt-token');`,
		`\`\`\``,
	];
}

function getTestPriorities(config: ScaffoldConfig): string[] {
	const lines = [
		`## What to Test — Priority Order`,
		``,
		`### 1. Security (highest priority)`,
		`- Auth middleware rejects missing/invalid/expired tokens with 401`,
		`- Auth middleware passes valid tokens and attaches user to request`,
	];

	if (config.database === 'mongodb') {
		lines.push(
			`- Query inputs are validated — \`$\` operator injection is rejected`,
			`- Sensitive fields are never returned in API responses`,
		);
	} else {
		lines.push(
			`- Database queries use parameterized inputs (never string concatenation)`,
			`- SQL injection attempts return 400, not 500`,
		);
	}

	lines.push(
		`- CORS rejects requests from non-whitelisted origins`,
		`- Error responses never contain stack traces or internal paths`,
		``,
		`### 2. Input Validation`,
		`- Valid inputs pass Zod validation and reach the service`,
		`- Invalid inputs return 400 with descriptive error (not 500)`,
		`- Edge cases: empty strings, negative numbers, oversized payloads, special characters`,
		`- Missing required fields are rejected`,
		``,
		`### 3. Business Logic (services)`,
		`- Happy path: correct inputs produce correct outputs`,
		`- Error path: service errors are handled gracefully (not swallowed)`,
		`- Boundary conditions: empty result sets, single vs multiple records, null fields`,
		``,
		`### 4. API Endpoints (integration)`,
		`- Correct HTTP status codes (200, 201, 400, 401, 404, 500)`,
		`- Response shapes match expected contracts`,
		`- Health endpoint returns 200 without authentication`,
	);

	return lines;
}

export function render(config: ScaffoldConfig): string {
	const lines = [
		`---`,
		`description: Senior test engineer for ${config.pluginName}. Writes thorough tests with mocking strategies for database, auth, and external services.`,
		`globs: "**/*.test.ts,**/*.spec.ts"`,
		`alwaysApply: false`,
		`---`,
		``,
		`# Senior Test Engineer Agent`,
		``,
		`You are a senior QA/test engineer writing tests for **${config.pluginName}**.`,
		`Tests must be deterministic, fast, isolated from external systems, and catch real bugs.`,
		``,
		`## Test Stack`,
		``,
		...getTestStack(config),
		``,
		`## Mocking Strategies`,
		``,
		...getDbMocking(config),
		``,
		...getAuthMocking(config),
		``,
		...getTestPriorities(config),
		``,
		`## Test Quality Standards`,
		``,
		`- **No flaky tests**: Mock all I/O (database, network, filesystem). Never depend on external services.`,
		`- **Descriptive names**: \`it('returns 401 when JWT token is expired')\` not \`it('works')\``,
		`- **One behavior per test**: Multiple assertions are fine if they verify the same behavior.`,
		`- **Edge cases are mandatory**: Empty inputs, boundary values, error paths — not optional.`,
		`- **Test the contract, not implementation**: Assert on inputs/outputs and side effects, not internal steps.`,
		`- **Clean up**: Each test creates its own state and cleans up after. No test depends on another.`,
		``,
		`## File Organization`,
		``,
		`\`\`\``,
	];

	if (config.projectType === 'saas') {
		lines.push(
			`backend/src/`,
			`  functions/__tests__/    # Function handler tests`,
			`  services/__tests__/     # Business logic tests`,
			`  middleware/__tests__/   # Auth middleware tests`,
		);
	} else if (config.projectType === 'standalone' && config.frontend === 'nextjs') {
		lines.push(
			`src/`,
			`  app/api/__tests__/      # API route handler tests`,
			`  lib/__tests__/          # Service and utility tests`,
		);
	} else {
		lines.push(
			`backend/src/`,
			`  routes/__tests__/       # Route handler tests`,
			`  services/__tests__/     # Business logic tests`,
			`  middleware/__tests__/   # Auth middleware tests`,
		);
	}

	lines.push(
		`\`\`\``,
		``,
		`## Running Tests`,
		``,
		`- Run all: \`npm test\``,
		`- Watch mode: \`npm run test:watch\``,
		`- Single file: \`npx vitest run path/to/file.test.ts\``,
		`- Never import from \`dist/\` — always import from source`,
		``,
	);

	return lines.join('\n');
}
