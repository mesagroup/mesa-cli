import type {ScaffoldConfig} from '../../types/scaffold';

export function render(_config: ScaffoldConfig): string {
	return `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
`;
}
