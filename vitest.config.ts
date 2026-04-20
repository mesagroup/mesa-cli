import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The scaffold suite spawns ~17 real `git init` + `git commit`
    // subprocesses across tests. The default 5s timeout intermittently
    // trips on slower runners (and consistently on CI for the Atlas
    // case, which used to be flagged "pre-existing"). 30s is generous.
    testTimeout: 30_000,
  },
});
