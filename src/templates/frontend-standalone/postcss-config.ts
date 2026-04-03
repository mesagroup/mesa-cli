import type {ScaffoldConfig} from '../../types/scaffold';

export function render(_config: ScaffoldConfig): string {
	return `import type { Config } from 'postcss-load-config';

const config: Config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
`;
}
