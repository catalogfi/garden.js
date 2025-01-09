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
      include: ['src/**/*.ts'],
      exclude: ['./node_modules'],
    }),
  ],
  build: {
    minify: false,
    lib: {
      entry: ['src/index.ts'],
      name: 'walletConnectors',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: [
        // Explicitly handle all dependencies as external
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.devDependencies || {}),
        /node_modules/, // This pattern will match all node_modules
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        dir: './dist',
        format: 'es',
        entryFileNames: ({ name: fileName }) => {
          // Ensure we're only processing source files
          if (fileName.includes('node_modules')) {
            return '[name].js';
          }
          return `${fileName}.js`;
        },
        chunkFileNames: '[name].js',
        manualChunks: undefined,
        indent: '    ',
        generatedCode: {
          constBindings: true,
          arrowFunctions: true,
          objectShorthand: true,
        },
      },
    },
    sourcemap: true,
  },
});
