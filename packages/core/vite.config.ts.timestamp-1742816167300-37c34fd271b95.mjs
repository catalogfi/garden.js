// vite.config.ts
import { defineConfig } from "file:///Users/saiadithya/Bankai/catalog/garden.js/node_modules/vite/dist/node/index.js";
import dts from "file:///Users/saiadithya/Bankai/catalog/garden.js/node_modules/vite-plugin-dts/dist/index.mjs";

// package.json
var package_default = {
  name: "@gardenfi/core",
  version: "2.0.22",
  type: "module",
  scripts: {
    build: "vite build",
    test: "vitest run",
    dev: "vite build --watch"
  },
  files: [
    "dist"
  ],
  main: "./dist/index.cjs",
  module: "./dist/index.js",
  typings: "./dist/src/index.d.ts",
  exports: {
    ".": {
      require: "./dist/index.cjs",
      import: "./dist/index.js",
      types: "./dist/src/index.d.ts"
    },
    "./package.json": "./package.json"
  },
  publishConfig: {
    access: "public",
    registry: "https://registry.npmjs.org/"
  },
  dependencies: {
    "@catalogfi/wallets": "^0.2.59",
    "@gardenfi/orderbook": "workspace:^",
    "@gardenfi/utils": "workspace:^",
    "bignumber.js": "^9.1.2",
    "bitcoinjs-lib": "^6.1.6",
    starknet: "^6.23.1",
    "tiny-secp256k1": "^2.2.3",
    "varuint-bitcoin": "^1.1.2",
    viem: "^2.21.23"
  },
  devDependencies: {
    dotenv: "^16.3.1",
    typescript: "^5.2.2",
    vite: "^5.1.6",
    "vite-plugin-dts": "^3.7.3",
    vitest: "^1.6.0"
  },
  sideEffects: false
};

// vite.config.ts
import eslint from "file:///Users/saiadithya/Bankai/catalog/garden.js/node_modules/vite-plugin-eslint/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [
    eslint(),
    dts({
      outDir: "./dist",
      pathsToAliases: false,
      entryRoot: "."
    })
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
      entry: "src/index.ts",
      name: "catalog",
      fileName: "index",
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ["es", "cjs"]
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: [
        ...Object.keys(package_default.dependencies || {})
        // ...[...builtinModules, ...builtinModules.map((m) => `node:${m}`)],
      ],
      output: {
        // preserveModules: true,
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAicGFja2FnZS5qc29uIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3NhaWFkaXRoeWEvQmFua2FpL2NhdGFsb2cvZ2FyZGVuLmpzL3BhY2thZ2VzL2NvcmVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9zYWlhZGl0aHlhL0JhbmthaS9jYXRhbG9nL2dhcmRlbi5qcy9wYWNrYWdlcy9jb3JlL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9zYWlhZGl0aHlhL0JhbmthaS9jYXRhbG9nL2dhcmRlbi5qcy9wYWNrYWdlcy9jb3JlL3ZpdGUuY29uZmlnLnRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9J3ZpdGVzdCcgLz5cbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IGR0cyBmcm9tICd2aXRlLXBsdWdpbi1kdHMnO1xuaW1wb3J0IHBrZyBmcm9tICcuL3BhY2thZ2UuanNvbic7XG5pbXBvcnQgZXNsaW50IGZyb20gJ3ZpdGUtcGx1Z2luLWVzbGludCc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICBlc2xpbnQoKSxcbiAgICBkdHMoe1xuICAgICAgb3V0RGlyOiAnLi9kaXN0JyxcbiAgICAgIHBhdGhzVG9BbGlhc2VzOiBmYWxzZSxcbiAgICAgIGVudHJ5Um9vdDogJy4nLFxuICAgIH0pLFxuICBdLFxuXG4gIC8vIFVuY29tbWVudCB0aGlzIGlmIHlvdSBhcmUgdXNpbmcgd29ya2Vycy5cbiAgLy8gd29ya2VyOiB7XG4gIC8vICBwbHVnaW5zOiBbIG54Vml0ZVRzUGF0aHMoKSBdLFxuICAvLyB9LFxuICAvLyBDb25maWd1cmF0aW9uIGZvciBidWlsZGluZyB5b3VyIGxpYnJhcnkuXG4gIC8vIFNlZTogaHR0cHM6Ly92aXRlanMuZGV2L2d1aWRlL2J1aWxkLmh0bWwjbGlicmFyeS1tb2RlXG4gIGJ1aWxkOiB7XG4gICAgbGliOiB7XG4gICAgICAvLyBDb3VsZCBhbHNvIGJlIGEgZGljdGlvbmFyeSBvciBhcnJheSBvZiBtdWx0aXBsZSBlbnRyeSBwb2ludHMuXG4gICAgICBlbnRyeTogJ3NyYy9pbmRleC50cycsXG4gICAgICBuYW1lOiAnY2F0YWxvZycsXG4gICAgICBmaWxlTmFtZTogJ2luZGV4JyxcbiAgICAgIC8vIENoYW5nZSB0aGlzIHRvIHRoZSBmb3JtYXRzIHlvdSB3YW50IHRvIHN1cHBvcnQuXG4gICAgICAvLyBEb24ndCBmb3JnZXQgdG8gdXBkYXRlIHlvdXIgcGFja2FnZS5qc29uIGFzIHdlbGwuXG4gICAgICBmb3JtYXRzOiBbJ2VzJywgJ2NqcyddLFxuICAgIH0sXG5cbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAvLyBFeHRlcm5hbCBwYWNrYWdlcyB0aGF0IHNob3VsZCBub3QgYmUgYnVuZGxlZCBpbnRvIHlvdXIgbGlicmFyeS5cbiAgICAgIGV4dGVybmFsOiBbXG4gICAgICAgIC4uLk9iamVjdC5rZXlzKHBrZy5kZXBlbmRlbmNpZXMgfHwge30pLFxuICAgICAgICAvLyAuLi5bLi4uYnVpbHRpbk1vZHVsZXMsIC4uLmJ1aWx0aW5Nb2R1bGVzLm1hcCgobSkgPT4gYG5vZGU6JHttfWApXSxcbiAgICAgIF0sXG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgLy8gcHJlc2VydmVNb2R1bGVzOiB0cnVlLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxufSk7XG4iLCAie1xuICBcIm5hbWVcIjogXCJAZ2FyZGVuZmkvY29yZVwiLFxuICBcInZlcnNpb25cIjogXCIyLjAuMjJcIixcbiAgXCJ0eXBlXCI6IFwibW9kdWxlXCIsXG4gIFwic2NyaXB0c1wiOiB7XG4gICAgXCJidWlsZFwiOiBcInZpdGUgYnVpbGRcIixcbiAgICBcInRlc3RcIjogXCJ2aXRlc3QgcnVuXCIsXG4gICAgXCJkZXZcIjogXCJ2aXRlIGJ1aWxkIC0td2F0Y2hcIlxuICB9LFxuICBcImZpbGVzXCI6IFtcbiAgICBcImRpc3RcIlxuICBdLFxuICBcIm1haW5cIjogXCIuL2Rpc3QvaW5kZXguY2pzXCIsXG4gIFwibW9kdWxlXCI6IFwiLi9kaXN0L2luZGV4LmpzXCIsXG4gIFwidHlwaW5nc1wiOiBcIi4vZGlzdC9zcmMvaW5kZXguZC50c1wiLFxuICBcImV4cG9ydHNcIjoge1xuICAgIFwiLlwiOiB7XG4gICAgICBcInJlcXVpcmVcIjogXCIuL2Rpc3QvaW5kZXguY2pzXCIsXG4gICAgICBcImltcG9ydFwiOiBcIi4vZGlzdC9pbmRleC5qc1wiLFxuICAgICAgXCJ0eXBlc1wiOiBcIi4vZGlzdC9zcmMvaW5kZXguZC50c1wiXG4gICAgfSxcbiAgICBcIi4vcGFja2FnZS5qc29uXCI6IFwiLi9wYWNrYWdlLmpzb25cIlxuICB9LFxuICBcInB1Ymxpc2hDb25maWdcIjoge1xuICAgIFwiYWNjZXNzXCI6IFwicHVibGljXCIsXG4gICAgXCJyZWdpc3RyeVwiOiBcImh0dHBzOi8vcmVnaXN0cnkubnBtanMub3JnL1wiXG4gIH0sXG4gIFwiZGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcIkBjYXRhbG9nZmkvd2FsbGV0c1wiOiBcIl4wLjIuNTlcIixcbiAgICBcIkBnYXJkZW5maS9vcmRlcmJvb2tcIjogXCJ3b3Jrc3BhY2U6XlwiLFxuICAgIFwiQGdhcmRlbmZpL3V0aWxzXCI6IFwid29ya3NwYWNlOl5cIixcbiAgICBcImJpZ251bWJlci5qc1wiOiBcIl45LjEuMlwiLFxuICAgIFwiYml0Y29pbmpzLWxpYlwiOiBcIl42LjEuNlwiLFxuICAgIFwic3RhcmtuZXRcIjogXCJeNi4yMy4xXCIsXG4gICAgXCJ0aW55LXNlY3AyNTZrMVwiOiBcIl4yLjIuM1wiLFxuICAgIFwidmFydWludC1iaXRjb2luXCI6IFwiXjEuMS4yXCIsXG4gICAgXCJ2aWVtXCI6IFwiXjIuMjEuMjNcIlxuICB9LFxuICBcImRldkRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJkb3RlbnZcIjogXCJeMTYuMy4xXCIsXG4gICAgXCJ0eXBlc2NyaXB0XCI6IFwiXjUuMi4yXCIsXG4gICAgXCJ2aXRlXCI6IFwiXjUuMS42XCIsXG4gICAgXCJ2aXRlLXBsdWdpbi1kdHNcIjogXCJeMy43LjNcIixcbiAgICBcInZpdGVzdFwiOiBcIl4xLjYuMFwiXG4gIH0sXG4gIFwic2lkZUVmZmVjdHNcIjogZmFsc2Vcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFNBQVM7OztBQ0ZoQjtBQUFBLEVBQ0UsTUFBUTtBQUFBLEVBQ1IsU0FBVztBQUFBLEVBQ1gsTUFBUTtBQUFBLEVBQ1IsU0FBVztBQUFBLElBQ1QsT0FBUztBQUFBLElBQ1QsTUFBUTtBQUFBLElBQ1IsS0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUNBLE9BQVM7QUFBQSxJQUNQO0FBQUEsRUFDRjtBQUFBLEVBQ0EsTUFBUTtBQUFBLEVBQ1IsUUFBVTtBQUFBLEVBQ1YsU0FBVztBQUFBLEVBQ1gsU0FBVztBQUFBLElBQ1QsS0FBSztBQUFBLE1BQ0gsU0FBVztBQUFBLE1BQ1gsUUFBVTtBQUFBLE1BQ1YsT0FBUztBQUFBLElBQ1g7QUFBQSxJQUNBLGtCQUFrQjtBQUFBLEVBQ3BCO0FBQUEsRUFDQSxlQUFpQjtBQUFBLElBQ2YsUUFBVTtBQUFBLElBQ1YsVUFBWTtBQUFBLEVBQ2Q7QUFBQSxFQUNBLGNBQWdCO0FBQUEsSUFDZCxzQkFBc0I7QUFBQSxJQUN0Qix1QkFBdUI7QUFBQSxJQUN2QixtQkFBbUI7QUFBQSxJQUNuQixnQkFBZ0I7QUFBQSxJQUNoQixpQkFBaUI7QUFBQSxJQUNqQixVQUFZO0FBQUEsSUFDWixrQkFBa0I7QUFBQSxJQUNsQixtQkFBbUI7QUFBQSxJQUNuQixNQUFRO0FBQUEsRUFDVjtBQUFBLEVBQ0EsaUJBQW1CO0FBQUEsSUFDakIsUUFBVTtBQUFBLElBQ1YsWUFBYztBQUFBLElBQ2QsTUFBUTtBQUFBLElBQ1IsbUJBQW1CO0FBQUEsSUFDbkIsUUFBVTtBQUFBLEVBQ1o7QUFBQSxFQUNBLGFBQWU7QUFDakI7OztBRDFDQSxPQUFPLFlBQVk7QUFFbkIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLElBQ1AsSUFBSTtBQUFBLE1BQ0YsUUFBUTtBQUFBLE1BQ1IsZ0JBQWdCO0FBQUEsTUFDaEIsV0FBVztBQUFBLElBQ2IsQ0FBQztBQUFBLEVBQ0g7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVFBLE9BQU87QUFBQSxJQUNMLEtBQUs7QUFBQTtBQUFBLE1BRUgsT0FBTztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ04sVUFBVTtBQUFBO0FBQUE7QUFBQSxNQUdWLFNBQVMsQ0FBQyxNQUFNLEtBQUs7QUFBQSxJQUN2QjtBQUFBLElBRUEsZUFBZTtBQUFBO0FBQUEsTUFFYixVQUFVO0FBQUEsUUFDUixHQUFHLE9BQU8sS0FBSyxnQkFBSSxnQkFBZ0IsQ0FBQyxDQUFDO0FBQUE7QUFBQSxNQUV2QztBQUFBLE1BQ0EsUUFBUTtBQUFBO0FBQUEsTUFFUjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
