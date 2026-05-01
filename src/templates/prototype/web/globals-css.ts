import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function render(_config: PrototypeConfig): string {
  return `@import "tailwindcss";

:root {
  color-scheme: dark;
}

html, body {
  background: #0a0a0a;
  color: #f5f5f5;
}
`;
}
