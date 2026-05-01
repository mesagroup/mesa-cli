import type { PrototypeConfig } from '../../../generators/prototype-scaffold';

export function render(_config: PrototypeConfig): string {
  return `packages:
  - 'apps/*'
  - 'packages/*'
`;
}
