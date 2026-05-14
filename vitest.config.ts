import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Scaffold tests do real I/O + `git init`; the default 5s budget is too tight
    // on slower CI runners.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
