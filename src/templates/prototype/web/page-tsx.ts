import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function render(config: PrototypeConfig): string {
  return `interface HealthStatus {
  status: string;
  db: string;
}

async function getHealth(): Promise<HealthStatus> {
  try {
    // Use absolute URL during SSR (server-side fetch needs a host); use a
    // relative URL in the browser. NEXT_PUBLIC_API_URL overrides for splits.
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL ?? \`http://localhost:\${process.env.PORT ?? '3000'}\`;
    const url = typeof window === 'undefined' ? \`\${baseUrl}/api/health\` : '/api/health';
    const res = await fetch(url, { cache: 'no-store' });
    return (await res.json()) as HealthStatus;
  } catch {
    return { status: 'error', db: 'unreachable' };
  }
}

export default async function Home() {
  const health = await getHealth();

  return (
    <main className="grid min-h-screen place-items-center p-8">
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight">${config.className}</h1>
        <p className="max-w-md text-gray-400">${config.description}</p>

        <div className="rounded-lg border border-gray-800 bg-gray-900 px-6 py-4 text-sm">
          API:{' '}
          <span className={health.status === 'ok' ? 'text-green-400' : 'text-red-400'}>
            {health.status}
          </span>{' '}
          · DB:{' '}
          <span className={health.db === 'connected' ? 'text-green-400' : 'text-red-400'}>
            {health.db}
          </span>
        </div>

        <div className="flex flex-col items-center gap-2 text-xs text-gray-500">
          <p>Try the auth flow:</p>
          <code className="rounded bg-black/40 px-2 py-1">POST /api/auth/register</code>
          <code className="rounded bg-black/40 px-2 py-1">POST /api/auth/login</code>
          <code className="rounded bg-black/40 px-2 py-1">GET /api/me (Bearer)</code>
        </div>
      </div>
    </main>
  );
}
`;
}
