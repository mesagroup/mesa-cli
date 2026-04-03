import type {ScaffoldConfig} from '../../types/scaffold';

export function render(_config: ScaffoldConfig): string {
	return `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
}
