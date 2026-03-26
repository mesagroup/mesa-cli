import type {ScaffoldConfig} from '../../types/scaffold';

export function render(_config: ScaffoldConfig): string {
	return `export interface Configuration {
  baseApiUrl: string;
}

export interface InputData {
  token: string;
  userId?: string;
}
`;
}
