import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // Bundle workspace deps (shared package) since they're source files, not compiled packages
  noExternal: ['@clarify/shared'],
});
