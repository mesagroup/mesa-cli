import type { ScaffoldConfig } from '../../types/scaffold';

export function render(_config: ScaffoldConfig): string {
	return JSON.stringify(
		{
			compilerOptions: {
				target: 'ES2020',
				module: 'commonjs',
				outDir: 'dist',
				strict: true,
				esModuleInterop: true,
				declaration: true,
				sourceMap: true,
				resolveJsonModule: true,
				skipLibCheck: true,
			},
			include: ['src'],
		},
		null,
		2,
	);
}
