/// <reference types='vitest' />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import pkg from './package.json';
import { config as loadEnv } from 'dotenv';
import path from 'path';

loadEnv({ path: path.resolve(__dirname, '.env') });
export default defineConfig({
  plugins: [
    // nodePolyfills(),
    dts({
      outDir: './dist',
      pathsToAliases: false,
      entryRoot: '.',
    }),
  ],
  define: {
    'process.env.ORDERBOOK_URL': JSON.stringify(process.env.ORDERBOOK_URL ?? ''),
    'process.env.AUTH_URL': JSON.stringify(process.env.AUTH_URL ?? ''),
    'process.env.QUOTE_URL': JSON.stringify(process.env.QUOTE_URL ?? ''),
    'process.env.INFO_URL': JSON.stringify(process.env.INFO_URL ?? ''),
    'process.env.BITCOIN_URL': JSON.stringify(process.env.BITCOIN_URL ?? ''),
    'process.env.ETHEREUM_URL': JSON.stringify(process.env.ETHEREUM_URL ?? ''),
    'process.env.ARBITRUM_URL': JSON.stringify(process.env.ARBITRUM_URL ?? ''),
    'process.env.BTCNODE_URL': JSON.stringify(process.env.BTCNODE_URL ?? ''),
    'process.env.STARKNET_URL': JSON.stringify(process.env.STARKNET_URL ?? ''),
    'process.env.EVM_RELAY_URL': JSON.stringify(process.env.EVM_RELAY_URL ?? ''),
    'process.env.STARKNET_RELAY_URL': JSON.stringify(process.env.STARKNET_RELAY_URL ?? ''),
    'process.env.PK': JSON.stringify(process.env.PK ?? ''),
  },
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
      name: 'utils',
      fileName: 'index',
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: [...Object.keys(pkg.dependencies ?? {})],
      output: {
        preserveModules: true,
        interop: 'auto',
      },
    },
  },
});
