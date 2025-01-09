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
      entryRoot: './src',
      copyDtsFiles: true,
      include: ['src/**/*.ts'],
    }),
  ],
  build: {
    minify: false,
    lib: {
      entry: ['src/index.ts'],
      name: 'catalog',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: [...Object.keys(pkg.dependencies || {})],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src', // Use 'src' as the root directory for preserving structure
        dir: './dist', // Ensure all files go to the `dist` directory
        format: 'es',
        entryFileNames: ({ name }) => `${name}.js`,
        chunkFileNames: ({ name }) => '[name].js',
        manualChunks: undefined,
        indent: '    ',
        generatedCode: {
          constBindings: true,
          arrowFunctions: true,
          objectShorthand: true,
        },
        sourcemap: true,
      },
    },
  },
});
