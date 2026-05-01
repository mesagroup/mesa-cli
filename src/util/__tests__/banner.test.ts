import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildBanner, shouldSuppressBanner } from '../banner';

describe('banner', () => {
  const origMesaNoBanner = process.env.MESA_NO_BANNER;
  const origMesaQuiet = process.env.MESA_QUIET;

  beforeEach(() => {
    delete process.env.MESA_NO_BANNER;
    delete process.env.MESA_QUIET;
  });

  afterEach(() => {
    if (origMesaNoBanner === undefined) delete process.env.MESA_NO_BANNER;
    else process.env.MESA_NO_BANNER = origMesaNoBanner;
    if (origMesaQuiet === undefined) delete process.env.MESA_QUIET;
    else process.env.MESA_QUIET = origMesaQuiet;
  });

  it('shouldSuppressBanner respects MESA_NO_BANNER', () => {
    process.env.MESA_NO_BANNER = '1';
    expect(shouldSuppressBanner()).toBe(true);
  });

  it('shouldSuppressBanner respects MESA_QUIET', () => {
    process.env.MESA_QUIET = '1';
    expect(shouldSuppressBanner()).toBe(true);
  });

  it('shouldSuppressBanner respects opts.quiet', () => {
    expect(shouldSuppressBanner({ quiet: true })).toBe(true);
  });

  it('shouldSuppressBanner returns false by default', () => {
    expect(shouldSuppressBanner()).toBe(false);
  });

  it('buildBanner returns the MESA banner text when not suppressed', () => {
    const out = buildBanner();
    expect(out.length).toBeGreaterThan(0);
    // Strip ANSI codes when checking for the letters.
    const stripped = out.replace(/\u001B\[[0-9;]*m/g, '');
    // M and E and S and A blocky shapes — at least the underscores+pipes are present.
    expect(stripped).toContain('|');
    expect(stripped).toContain('_');
  });

  it('buildBanner returns empty string when suppressed', () => {
    process.env.MESA_NO_BANNER = '1';
    expect(buildBanner()).toBe('');
  });

  it('buildBanner appends subtitle when provided', () => {
    const out = buildBanner({ subtitle: 'Hello world' });
    const stripped = out.replace(/\u001B\[[0-9;]*m/g, '');
    expect(stripped).toContain('Hello world');
  });
});
