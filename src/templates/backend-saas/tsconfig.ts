import type { ScaffoldConfig } from '../../types/scaffold';

export function render(_config: ScaffoldConfig): string {
	return JSON.stringify(
		{
			compilerOptions: {
				target: 'ES2022',
				module: 'Node16',
				moduleResolution: 'Node16',
				outDir: 'dist',
				rootDir: 'src',
				strict: true,
				esModuleInterop: true,
				declaration: true,
				sourceMap: true,
				skipLibCheck: true,
			},
			include: ['src'],
		},
		null,
		2,
	);
}
