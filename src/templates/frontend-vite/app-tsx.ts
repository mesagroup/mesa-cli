import type {ScaffoldConfig} from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
	return `import { useEffect, useState } from 'react';

interface HealthStatus {
  status: string;
  db: string;
}

function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data: HealthStatus) => setHealth(data))
      .catch(() => setHealth({ status: 'error', db: 'unreachable' }));
  }, []);

  return (
    <div className="grid min-h-screen place-items-center bg-gray-950 p-8">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white">
          ${config.pluginClassName}
        </h1>
        <p className="text-lg text-gray-400">${config.description}</p>

        <div className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 px-6 py-3 font-mono text-sm">
          {health ? (
            <>
              <span
                className={\`inline-block h-2.5 w-2.5 rounded-full \${
                  health.status === 'ok' ? 'bg-green-400' : 'bg-red-400'
                }\`}
              />
              <span className="text-gray-300">
                API: {health.status} &middot; DB: {health.db}
              </span>
            </>
          ) : (
            <span className="text-gray-500">Connecting...</span>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
`;
}
