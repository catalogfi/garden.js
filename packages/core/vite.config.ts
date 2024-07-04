/// <reference types='vitest' />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import * as path from 'path';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import pkg from './package.json';
import { builtinModules } from 'module';

export default defineConfig({
  cacheDir: '../node_modules/.vite/catalog',

  plugins: [
    wasm(),
    topLevelAwait(),
    // nodePolyfills(),
    dts({
      outDir: './dist',
      pathsToAliases: false,
      entryRoot: '.',
    }),
  ],

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
      name: 'catalog',
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
