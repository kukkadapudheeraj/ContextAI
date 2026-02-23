import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest.json';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    crx({ manifest }),
  ],

  build: {
    // Use Terser for stronger minification than the default esbuild
    minify: 'terser',

    // Never emit source maps in production — they expose the original source
    sourcemap: false,

    terserOptions: {
      compress: {
        // Run two compression passes for smaller, harder-to-read output
        passes: 2,
        // Strip any console.* calls that might have slipped through
        drop_console: true,
        // Remove debugger statements
        drop_debugger: true,
        // Inline short functions aggressively
        inline: 2,
      },
      mangle: {
        // Shorten all local variable and function names to single letters
        toplevel: false, // leave top-level names intact (safer for Chrome APIs)
        safari10: true,  // broader compatibility
      },
      format: {
        // Strip every comment from the output bundle
        comments: false,
      },
    },
  },

  // Dev builds keep source maps so you can debug locally
  ...(mode === 'development' && {
    build: { sourcemap: true, minify: false },
  }),

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
}));
