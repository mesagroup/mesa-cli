import type {ScaffoldConfig} from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
	const {pluginName} = config;
	// Convert kebab-case to camelCase for the module federation name
	const camelName = pluginName.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

	return `const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
  name: '${camelName}',

  exposes: {
    './Module': './projects/${pluginName}/src/public-api.ts',
  },

  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
    }),
  },
});
`;
}
