import { describe, expect, it } from 'vitest';
import { getToolsForProjectType } from '../tool-checker';

describe('getToolsForProjectType', () => {
  it('uses Azure Functions tooling for saas projects', () => {
    const names = getToolsForProjectType('saas').map(tool => tool.name);

    expect(names).toContain('func');
    expect(names).not.toContain('docker');
    expect(names).not.toContain('aspire');
  });

  it('keeps docker and aspire for on-prem and standalone projects', () => {
    const onPremNames = getToolsForProjectType('onprem').map(tool => tool.name);
    const standaloneNames = getToolsForProjectType('standalone').map(tool => tool.name);

    expect(onPremNames).toContain('docker');
    expect(onPremNames).toContain('aspire');
    expect(onPremNames).not.toContain('func');
    expect(standaloneNames).toContain('docker');
    expect(standaloneNames).toContain('aspire');
    expect(standaloneNames).not.toContain('func');
  });
});
