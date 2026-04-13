import type { ScaffoldConfig } from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
  const { pluginClassName } = config;

  return `import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ${pluginClassName}Service {
  constructor(private readonly http: HttpClient) {}
}
`;
}
