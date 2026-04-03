import type {ScaffoldConfig} from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
	return `interface HealthStatus {
  status: string;
  db: string;
}

async function getHealth(): Promise<HealthStatus> {
  try {
    const res = await fetch(
      \`\${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/api/health\`,
      { cache: 'no-store' },
    );
    return res.json() as Promise<HealthStatus>;
  } catch {
    return { status: 'error', db: 'unreachable' };
  }
}

export default async function Home() {
  const health = await getHealth();

  return (
    <div className="grid min-h-screen place-items-center bg-gray-950 p-8 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white">
          ${config.pluginClassName}
        </h1>
        <p className="text-lg text-gray-400">
          ${config.description}
        </p>
        <div className="rounded-lg border border-gray-800 bg-gray-900 px-6 py-4 text-sm text-gray-300">
          API:{' '}
          <span
            className={
              health.status === 'ok' ? 'text-green-400' : 'text-red-400'
            }
          >
            {health.status}
          </span>
          {' · '}
          DB:{' '}
          <span
            className={
              health.db === 'connected' ? 'text-green-400' : 'text-red-400'
            }
          >
            {health.db}
          </span>
        </div>
      </main>
    </div>
  );
}
`;
}
