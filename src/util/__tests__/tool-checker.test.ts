import { describe, it, expect } from 'vitest';
import { compareVersions, meetsMinVersion } from '../tool-checker';

describe('compareVersions', () => {
  it('returns 0 for equal versions', () => {
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    expect(compareVersions('10.0', '10.0')).toBe(0);
    expect(compareVersions('2.30', '2.30')).toBe(0);
  });

  it('returns -1 when a < b', () => {
    expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
    expect(compareVersions('5.0.411', '10.0')).toBe(-1);
    expect(compareVersions('2.29', '2.30')).toBe(-1);
    expect(compareVersions('18.0', '20.0')).toBe(-1);
  });

  it('returns 1 when a > b', () => {
    expect(compareVersions('2.0.0', '1.0.0')).toBe(1);
    expect(compareVersions('10.0', '5.0.411')).toBe(1);
    expect(compareVersions('2.31', '2.30')).toBe(1);
    expect(compareVersions('22.0', '18.0')).toBe(1);
  });

  it('handles versions with different lengths', () => {
    expect(compareVersions('2.0', '2.0.0')).toBe(0);
    expect(compareVersions('10', '10.0.0')).toBe(0);
    expect(compareVersions('1.0', '1.0.1')).toBe(-1);
    expect(compareVersions('2.1', '2.0.9')).toBe(1);
  });

  it('handles the .NET 5 vs 10 scenario from the issue', () => {
    expect(compareVersions('5.0.411', '10.0')).toBe(-1);
  });
});

describe('meetsMinVersion', () => {
  it('returns true when version meets minimum', () => {
    expect(meetsMinVersion('10.0', '10.0')).toBe(true);
    expect(meetsMinVersion('10.1', '10.0')).toBe(true);
    expect(meetsMinVersion('18.12.1', '18.0')).toBe(true);
  });

  it('returns false when version is below minimum', () => {
    expect(meetsMinVersion('5.0.411', '10.0')).toBe(false);
    expect(meetsMinVersion('17.9', '18.0')).toBe(false);
    expect(meetsMinVersion('19.0', '20.0')).toBe(false);
  });

  it('validates minimum versions from the issue requirements', () => {
    expect(meetsMinVersion('10.0.105', '10.0')).toBe(true);
    expect(meetsMinVersion('5.0.411', '10.0')).toBe(false);

    expect(meetsMinVersion('18.19.0', '18.0')).toBe(true);
    expect(meetsMinVersion('16.20.0', '18.0')).toBe(false);

    expect(meetsMinVersion('24.0.7', '20.0')).toBe(true);
    expect(meetsMinVersion('19.3.12', '20.0')).toBe(false);

    expect(meetsMinVersion('2.39.2', '2.30')).toBe(true);
    expect(meetsMinVersion('2.25.0', '2.30')).toBe(false);

    expect(meetsMinVersion('13.0.1', '13.0')).toBe(true);
    expect(meetsMinVersion('12.9.0', '13.0')).toBe(false);
  });
});
