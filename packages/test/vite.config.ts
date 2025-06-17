import topLevelAwait from 'vite-plugin-top-level-await';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import wasm from 'vite-plugin-wasm';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), wasm(), nodePolyfills(), topLevelAwait()],
  publicDir: 'public',
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        // sw: './public/garden-service-worker.js',
      },
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
    proxy: {
      '/sw.js': 'http://localhost:3000',
    },
  },
});
