import topLevelAwait from 'vite-plugin-top-level-await';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import wasm from 'vite-plugin-wasm';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    wasm(),
    nodePolyfills(),
    topLevelAwait(),
  ],
  // server: {
  //   proxy: {
  //     '/fund': {
  //       target: 'http://10.67.21.155:3000/faucet',
  //       changeOrigin: true,
  //       secure: false
  //     }
  //   },
  //   hmr: true,
  //   watch: {
  //     usePolling: true,
  //   },
  // },
});
