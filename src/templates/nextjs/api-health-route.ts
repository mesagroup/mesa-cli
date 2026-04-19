import type { ScaffoldConfig } from '../../types/scaffold';
import { getDbModule } from '../db';

export function render(config: ScaffoldConfig): string {
  const db = getDbModule(config);

  return `import { NextResponse } from 'next/server';
${db.getHealthCheckImport('nextjs')}

export async function GET() {
  try {
${db.renderHealthCheck(config)}
    return NextResponse.json({ status: 'ok', db: 'connected' });
  } catch {
    return NextResponse.json(
      { status: 'degraded', db: 'disconnected' },
      { status: 503 },
    );
  }
}
`;
}
