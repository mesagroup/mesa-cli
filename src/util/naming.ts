/**
 * Convert a string to kebab-case.
 * "AssetTracker" → "asset-tracker", "asset tracker" → "asset-tracker"
 */
export function toKebabCase(input: string): string {
  return input
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/gi, '')
    .toLowerCase();
}

/**
 * Convert a kebab-case string to PascalCase.
 * "asset-tracker" → "AssetTracker"
 */
export function toPascalCase(kebab: string): string {
  return kebab
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Validate a plugin name: lowercase kebab-case, 2-50 chars, no leading digits.
 */
export function validatePluginName(name: string): { valid: boolean; error?: string } {
  if (name.length < 2 || name.length > 50) {
    return { valid: false, error: 'Plugin name must be between 2 and 50 characters' };
  }

  if (/^\d/.test(name)) {
    return { valid: false, error: 'Plugin name must not start with a digit' };
  }

  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    return {
      valid: false,
      error: 'Plugin name must be lowercase kebab-case (letters, digits, hyphens)',
    };
  }

  if (name.startsWith('-') || name.endsWith('-') || name.includes('--')) {
    return { valid: false, error: 'Plugin name must not start/end with a hyphen or have consecutive hyphens' };
  }

  return { valid: true };
}
