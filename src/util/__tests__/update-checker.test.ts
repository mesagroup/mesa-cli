import { describe, it, expect } from 'vitest';
import { compareVersions, getCliUpdateCommand, PACKAGE_NAME } from '../update-checker';

describe('compareVersions', () => {
  it('returns upToDate true when versions match', () => {
    expect(compareVersions('1.2.3', '1.2.3').upToDate).toBe(true);
  });

  it('returns upToDate false when versions differ', () => {
    expect(compareVersions('1.2.2', '1.2.3').upToDate).toBe(false);
  });

  it('returns upToDate false when either version is missing', () => {
    expect(compareVersions(undefined, '1.2.3').upToDate).toBe(false);
    expect(compareVersions('1.2.3', undefined).upToDate).toBe(false);
    expect(compareVersions(undefined, undefined).upToDate).toBe(false);
  });

  it('preserves both versions in the returned shape', () => {
    const r = compareVersions('1.0.0', '2.0.0');
    expect(r).toEqual({ current: '1.0.0', latest: '2.0.0', upToDate: false });
  });
});

describe('getCliUpdateCommand', () => {
  it('produces the right shell command per install method', () => {
    expect(getCliUpdateCommand('npm-global')).toBe(`npm install -g ${PACKAGE_NAME}@latest`);
    expect(getCliUpdateCommand('pnpm-global')).toBe(`pnpm add -g ${PACKAGE_NAME}@latest`);
    expect(getCliUpdateCommand('yarn-global')).toBe(`yarn global add ${PACKAGE_NAME}@latest`);
    expect(getCliUpdateCommand('local')).toBe(`npm install ${PACKAGE_NAME}@latest`);
  });

  it('returns undefined for non-upgradeable methods', () => {
    expect(getCliUpdateCommand('npx-cache')).toBeUndefined();
    expect(getCliUpdateCommand('unknown')).toBeUndefined();
  });
});
