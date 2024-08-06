/// <reference types='vitest' />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import pkg from './package.json';
import react from '@vitejs/plugin-react';

export default defineConfig({
  cacheDir: '../node_modules/.vite/orderbook',

  plugins: [
    react(),
    dts({
      outDir: './dist',
      pathsToAliases: false,
      entryRoot: '.',
      tsconfigPath: './tsconfig.lib.json',
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
      entry: 'index.ts',
      name: 'debridge',
      fileName: 'index',
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ['cjs', 'es'],
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: [
        'react/jsx-runtime',
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
      ],
      output: {
        preserveModules: true,
      },
    },
  },
});
