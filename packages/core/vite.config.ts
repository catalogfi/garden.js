/// <reference types='vitest' />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import pkg from './package.json';
import eslint from 'vite-plugin-eslint';

export default defineConfig({
  plugins: [
    eslint(),
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
      entry: 'src/index.ts',
      name: 'catalog',
      fileName: 'index',
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ['es', 'cjs'],
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
