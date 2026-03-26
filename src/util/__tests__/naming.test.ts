import { describe, it, expect } from 'vitest';
import { toKebabCase, toPascalCase, validatePluginName } from '../naming';

describe('toKebabCase', () => {
  it('converts PascalCase to kebab', () => {
    expect(toKebabCase('AssetTracker')).toBe('asset-tracker');
  });

  it('converts spaces to hyphens', () => {
    expect(toKebabCase('asset tracker')).toBe('asset-tracker');
  });

  it('converts underscores to hyphens', () => {
    expect(toKebabCase('asset_tracker')).toBe('asset-tracker');
  });

  it('lowercases everything', () => {
    expect(toKebabCase('ASSET')).toBe('asset');
  });

  it('strips non-alphanumeric chars', () => {
    expect(toKebabCase('my@plugin!')).toBe('myplugin');
  });
});

describe('toPascalCase', () => {
  it('converts kebab to PascalCase', () => {
    expect(toPascalCase('asset-tracker')).toBe('AssetTracker');
  });

  it('handles single word', () => {
    expect(toPascalCase('plugin')).toBe('Plugin');
  });

  it('handles multi-part', () => {
    expect(toPascalCase('my-cool-plugin')).toBe('MyCoolPlugin');
  });
});

describe('validatePluginName', () => {
  it('accepts valid names', () => {
    expect(validatePluginName('my-plugin')).toEqual({ valid: true });
    expect(validatePluginName('plugin123')).toEqual({ valid: true });
    expect(validatePluginName('ab')).toEqual({ valid: true });
  });

  it('rejects too short', () => {
    expect(validatePluginName('a').valid).toBe(false);
  });

  it('rejects too long', () => {
    expect(validatePluginName('a'.repeat(51)).valid).toBe(false);
  });

  it('rejects leading digit', () => {
    expect(validatePluginName('1plugin').valid).toBe(false);
  });

  it('rejects uppercase', () => {
    expect(validatePluginName('MyPlugin').valid).toBe(false);
  });

  it('rejects consecutive hyphens', () => {
    expect(validatePluginName('my--plugin').valid).toBe(false);
  });

  it('rejects trailing hyphen', () => {
    expect(validatePluginName('my-plugin-').valid).toBe(false);
  });
});
