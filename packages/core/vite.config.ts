/// <reference types='vitest' />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import pkg from './package.json';
import eslint from 'vite-plugin-eslint';

export default defineConfig({
  cacheDir: '../node_modules/.vite/core',

  plugins: [
    eslint(),
    wasm(),
    topLevelAwait(),
    // tsconfigPaths(),
    dts({
      outDir: './dist',
      pathsToAliases: false,
      entryRoot: '.',
      tsconfigPath: './tsconfig.lib.json',
    }),
  ],

  resolve: {
    preserveSymlinks: true,
  },

  test: {
    alias: {
      '@gardenfi/orderbook': new URL('../orderbook', import.meta.url).pathname,
    },
  },

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  // Configuration for building your library.
  // See: https://vitejs.dev/guide/build.html#library-mode
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points.
      entry: 'index.ts',
      name: 'core',
      fileName: 'index',
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ['es', 'cjs'],
    },
    commonjsOptions: {
      include: [],
    },

    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: [
        ...Object.keys(pkg.dependencies || {}),
        // ...[...builtinModules, ...builtinModules.map((m) => `node:${m}`)],
      ],
      output: {
        // preserveModules: true,
      },
    },
  },
});
