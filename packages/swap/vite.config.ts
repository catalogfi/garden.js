/// <reference types='vitest' />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import pkg from './package.json';
import eslint from 'vite-plugin-eslint';

export default defineConfig({
  cacheDir: '../node_modules/.vite/swap',

  plugins: [
    eslint(),
    dts({
      outDir: './dist',
      pathsToAliases: false,
      entryRoot: '.',
    }),
  ],

  build: {
    commonjsOptions: {
      include: [],
    },
    lib: {
      entry: 'src/index.ts',
      name: 'swap',
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [...Object.keys(pkg.dependencies || {}), 'src/test/**/*'],
      output: {
        preserveModules: true,
      },
    },
  },
});
