/// <reference types='vitest' />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import pkg from './package.json';

export default defineConfig({
  cacheDir: '../node_modules/.vite/leaderboard',

  plugins: [
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
    commonjsOptions: {
      include: [],
    },
    lib: {
      // Could also be a dictionary or array of multiple entry points.
      entry: 'src/index.ts',
      name: 'leaderboard',
      fileName: 'index',
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      //   external: [...Object.keys(pkg.dependencies || {})],
      output: {
        preserveModules: true,
      },
    },
  },
});
