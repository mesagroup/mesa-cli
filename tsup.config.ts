import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
  },
  {
    entry: ["src/cli.ts"],
    format: ["esm"],
    dts: true,
    clean: true,
    splitting: false,
    minify: true,
    outDir: "dist",
    banner: {
      js: "#!/usr/bin/env node",
    },
  },
]);
