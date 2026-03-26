import type {ScaffoldConfig} from '../../types/scaffold';

export function render(_config: ScaffoldConfig): string {
	return `const PROXY_CONFIG = [
  {
    context: ['/api'],
    target: process.env['services__api__http__0'] || 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
  },
];

module.exports = PROXY_CONFIG;
`;
}
