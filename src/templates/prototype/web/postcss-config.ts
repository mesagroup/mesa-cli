import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function render(_config: PrototypeConfig): string {
  return `export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
`;
}
