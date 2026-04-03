import type {ScaffoldConfig} from '../../types/scaffold';

export function render(_config: ScaffoldConfig): string {
	return `@import "tailwindcss";
`;
}
