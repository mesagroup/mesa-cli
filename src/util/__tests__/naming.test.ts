import { describe, it, expect } from 'vitest';
import { toKebabCase, toPascalCase, validatePluginName, validateGitHubName, isShellSafe } from '../naming';

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

describe('validateGitHubName', () => {
  it('accepts valid GitHub org/repo names', () => {
    expect(validateGitHubName('mesagroup')).toEqual({ valid: true });
    expect(validateGitHubName('my-org')).toEqual({ valid: true });
    expect(validateGitHubName('org_name')).toEqual({ valid: true });
    expect(validateGitHubName('MyOrg123')).toEqual({ valid: true });
    expect(validateGitHubName('org.name')).toEqual({ valid: true });
  });

  it('rejects empty names', () => {
    expect(validateGitHubName('').valid).toBe(false);
  });

  it('rejects names too long', () => {
    expect(validateGitHubName('a'.repeat(101)).valid).toBe(false);
  });

  it('rejects names starting with special characters', () => {
    expect(validateGitHubName('-org').valid).toBe(false);
    expect(validateGitHubName('.org').valid).toBe(false);
    expect(validateGitHubName('_org').valid).toBe(false);
  });

  it('rejects command injection attempts', () => {
    expect(validateGitHubName('org; rm -rf /').valid).toBe(false);
    expect(validateGitHubName('org$(whoami)').valid).toBe(false);
    expect(validateGitHubName('org`id`').valid).toBe(false);
    expect(validateGitHubName('org && echo pwned').valid).toBe(false);
    expect(validateGitHubName('org|cat /etc/passwd').valid).toBe(false);
  });
});

describe('isShellSafe', () => {
  it('returns true for safe strings', () => {
    expect(isShellSafe('mesagroup')).toBe(true);
    expect(isShellSafe('my-plugin')).toBe(true);
    expect(isShellSafe('path/to/file')).toBe(true);
    expect(isShellSafe('file.txt')).toBe(true);
    expect(isShellSafe('under_score')).toBe(true);
  });

  it('returns false for dangerous strings', () => {
    expect(isShellSafe('test; rm -rf /')).toBe(false);
    expect(isShellSafe('$(whoami)')).toBe(false);
    expect(isShellSafe('`id`')).toBe(false);
    expect(isShellSafe('test && echo')).toBe(false);
    expect(isShellSafe('test | cat')).toBe(false);
    expect(isShellSafe('test > file')).toBe(false);
    expect(isShellSafe('test < file')).toBe(false);
    expect(isShellSafe("test'injection")).toBe(false);
    expect(isShellSafe('test"injection')).toBe(false);
    expect(isShellSafe('test with space')).toBe(false);
  });
});
