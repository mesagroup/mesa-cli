import type { ScaffoldConfig } from '../../types/scaffold';

export function render(_config: ScaffoldConfig): string {
  return JSON.stringify(
    {
      version: '2.0',
      extensionBundle: {
        id: 'Microsoft.Azure.Functions.ExtensionBundle',
        version: '[4.*, 5.0.0)',
      },
      logging: {
        applicationInsights: {
          samplingSettings: {
            isEnabled: true,
            excludedTypes: 'Request',
          },
        },
      },
    },
    null,
    2
  );
}
