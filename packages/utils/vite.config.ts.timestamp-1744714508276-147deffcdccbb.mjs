// vite.config.ts
import { defineConfig } from "file:///C:/Users/Pc/Desktop/New%20folder/garden.js/node_modules/vite/dist/node/index.js";
import dts from "file:///C:/Users/Pc/Desktop/New%20folder/garden.js/node_modules/vite-plugin-dts/dist/index.mjs";

// package.json
var package_default = {
  name: "@gardenfi/utils",
  version: "2.0.6-beta.13",
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
  devDependencies: {
    "@types/ws": "^8.5.7",
    dotenv: "^16.3.1",
    typescript: "^5.2.2",
    vite: "^5.1.6",
    "vite-plugin-dts": "^3.7.3",
    vitest: "^1.6.0"
  },
  sideEffects: false,
  dependencies: {
    "@peculiar/webcrypto": "^1.5.0",
    "@simplewebauthn/browser": "^13.1.0",
    "fetch-cookie": "^3.1.0",
    "jwt-decode": "^4.0.0",
    "tough-cookie": "^5.1.2",
    viem: "^2.21.23"
  }
};

// vite.config.ts
var vite_config_default = defineConfig({
  plugins: [
    // nodePolyfills(),
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
    commonjsOptions: {
      include: []
    },
    lib: {
      // Could also be a dictionary or array of multiple entry points.
      entry: "src/index.ts",
      name: "utils",
      fileName: "index",
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ["es", "cjs"]
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: [...Object.keys(package_default.dependencies || {})],
      output: {
        preserveModules: true
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAicGFja2FnZS5qc29uIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcUGNcXFxcRGVza3RvcFxcXFxOZXcgZm9sZGVyXFxcXGdhcmRlbi5qc1xcXFxwYWNrYWdlc1xcXFx1dGlsc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcUGNcXFxcRGVza3RvcFxcXFxOZXcgZm9sZGVyXFxcXGdhcmRlbi5qc1xcXFxwYWNrYWdlc1xcXFx1dGlsc1xcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvUGMvRGVza3RvcC9OZXclMjBmb2xkZXIvZ2FyZGVuLmpzL3BhY2thZ2VzL3V0aWxzL3ZpdGUuY29uZmlnLnRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9J3ZpdGVzdCcgLz5cclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCBkdHMgZnJvbSAndml0ZS1wbHVnaW4tZHRzJztcclxuaW1wb3J0IHBrZyBmcm9tICcuL3BhY2thZ2UuanNvbic7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIC8vIG5vZGVQb2x5ZmlsbHMoKSxcclxuICAgIGR0cyh7XHJcbiAgICAgIG91dERpcjogJy4vZGlzdCcsXHJcbiAgICAgIHBhdGhzVG9BbGlhc2VzOiBmYWxzZSxcclxuICAgICAgZW50cnlSb290OiAnLicsXHJcbiAgICB9KSxcclxuICBdLFxyXG5cclxuICAvLyBVbmNvbW1lbnQgdGhpcyBpZiB5b3UgYXJlIHVzaW5nIHdvcmtlcnMuXHJcbiAgLy8gd29ya2VyOiB7XHJcbiAgLy8gIHBsdWdpbnM6IFsgbnhWaXRlVHNQYXRocygpIF0sXHJcbiAgLy8gfSxcclxuICAvLyBDb25maWd1cmF0aW9uIGZvciBidWlsZGluZyB5b3VyIGxpYnJhcnkuXHJcbiAgLy8gU2VlOiBodHRwczovL3ZpdGVqcy5kZXYvZ3VpZGUvYnVpbGQuaHRtbCNsaWJyYXJ5LW1vZGVcclxuICBidWlsZDoge1xyXG4gICAgY29tbW9uanNPcHRpb25zOiB7XHJcbiAgICAgIGluY2x1ZGU6IFtdLFxyXG4gICAgfSxcclxuICAgIGxpYjoge1xyXG4gICAgICAvLyBDb3VsZCBhbHNvIGJlIGEgZGljdGlvbmFyeSBvciBhcnJheSBvZiBtdWx0aXBsZSBlbnRyeSBwb2ludHMuXHJcbiAgICAgIGVudHJ5OiAnc3JjL2luZGV4LnRzJyxcclxuICAgICAgbmFtZTogJ3V0aWxzJyxcclxuICAgICAgZmlsZU5hbWU6ICdpbmRleCcsXHJcbiAgICAgIC8vIENoYW5nZSB0aGlzIHRvIHRoZSBmb3JtYXRzIHlvdSB3YW50IHRvIHN1cHBvcnQuXHJcbiAgICAgIC8vIERvbid0IGZvcmdldCB0byB1cGRhdGUgeW91ciBwYWNrYWdlLmpzb24gYXMgd2VsbC5cclxuICAgICAgZm9ybWF0czogWydlcycsICdjanMnXSxcclxuICAgIH0sXHJcbiAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgIC8vIEV4dGVybmFsIHBhY2thZ2VzIHRoYXQgc2hvdWxkIG5vdCBiZSBidW5kbGVkIGludG8geW91ciBsaWJyYXJ5LlxyXG4gICAgICBleHRlcm5hbDogWy4uLk9iamVjdC5rZXlzKHBrZy5kZXBlbmRlbmNpZXMgfHwge30pXSxcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgcHJlc2VydmVNb2R1bGVzOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9LFxyXG59KTtcclxuIiwgIntcclxuICBcIm5hbWVcIjogXCJAZ2FyZGVuZmkvdXRpbHNcIixcclxuICBcInZlcnNpb25cIjogXCIyLjAuNi1iZXRhLjEzXCIsXHJcbiAgXCJ0eXBlXCI6IFwibW9kdWxlXCIsXHJcbiAgXCJzY3JpcHRzXCI6IHtcclxuICAgIFwiYnVpbGRcIjogXCJ2aXRlIGJ1aWxkXCIsXHJcbiAgICBcInRlc3RcIjogXCJ2aXRlc3QgcnVuXCIsXHJcbiAgICBcImRldlwiOiBcInZpdGUgYnVpbGQgLS13YXRjaFwiXHJcbiAgfSxcclxuICBcImZpbGVzXCI6IFtcclxuICAgIFwiZGlzdFwiXHJcbiAgXSxcclxuICBcIm1haW5cIjogXCIuL2Rpc3QvaW5kZXguY2pzXCIsXHJcbiAgXCJtb2R1bGVcIjogXCIuL2Rpc3QvaW5kZXguanNcIixcclxuICBcInR5cGluZ3NcIjogXCIuL2Rpc3Qvc3JjL2luZGV4LmQudHNcIixcclxuICBcImV4cG9ydHNcIjoge1xyXG4gICAgXCIuXCI6IHtcclxuICAgICAgXCJyZXF1aXJlXCI6IFwiLi9kaXN0L2luZGV4LmNqc1wiLFxyXG4gICAgICBcImltcG9ydFwiOiBcIi4vZGlzdC9pbmRleC5qc1wiLFxyXG4gICAgICBcInR5cGVzXCI6IFwiLi9kaXN0L3NyYy9pbmRleC5kLnRzXCJcclxuICAgIH0sXHJcbiAgICBcIi4vcGFja2FnZS5qc29uXCI6IFwiLi9wYWNrYWdlLmpzb25cIlxyXG4gIH0sXHJcbiAgXCJwdWJsaXNoQ29uZmlnXCI6IHtcclxuICAgIFwiYWNjZXNzXCI6IFwicHVibGljXCIsXHJcbiAgICBcInJlZ2lzdHJ5XCI6IFwiaHR0cHM6Ly9yZWdpc3RyeS5ucG1qcy5vcmcvXCJcclxuICB9LFxyXG4gIFwiZGV2RGVwZW5kZW5jaWVzXCI6IHtcclxuICAgIFwiQHR5cGVzL3dzXCI6IFwiXjguNS43XCIsXHJcbiAgICBcImRvdGVudlwiOiBcIl4xNi4zLjFcIixcclxuICAgIFwidHlwZXNjcmlwdFwiOiBcIl41LjIuMlwiLFxyXG4gICAgXCJ2aXRlXCI6IFwiXjUuMS42XCIsXHJcbiAgICBcInZpdGUtcGx1Z2luLWR0c1wiOiBcIl4zLjcuM1wiLFxyXG4gICAgXCJ2aXRlc3RcIjogXCJeMS42LjBcIlxyXG4gIH0sXHJcbiAgXCJzaWRlRWZmZWN0c1wiOiBmYWxzZSxcclxuICBcImRlcGVuZGVuY2llc1wiOiB7XHJcbiAgICBcIkBwZWN1bGlhci93ZWJjcnlwdG9cIjogXCJeMS41LjBcIixcclxuICAgIFwiQHNpbXBsZXdlYmF1dGhuL2Jyb3dzZXJcIjogXCJeMTMuMS4wXCIsXHJcbiAgICBcImZldGNoLWNvb2tpZVwiOiBcIl4zLjEuMFwiLFxyXG4gICAgXCJqd3QtZGVjb2RlXCI6IFwiXjQuMC4wXCIsXHJcbiAgICBcInRvdWdoLWNvb2tpZVwiOiBcIl41LjEuMlwiLFxyXG4gICAgXCJ2aWVtXCI6IFwiXjIuMjEuMjNcIlxyXG4gIH1cclxufVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxTQUFTOzs7QUNGaEI7QUFBQSxFQUNFLE1BQVE7QUFBQSxFQUNSLFNBQVc7QUFBQSxFQUNYLE1BQVE7QUFBQSxFQUNSLFNBQVc7QUFBQSxJQUNULE9BQVM7QUFBQSxJQUNULE1BQVE7QUFBQSxJQUNSLEtBQU87QUFBQSxFQUNUO0FBQUEsRUFDQSxPQUFTO0FBQUEsSUFDUDtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE1BQVE7QUFBQSxFQUNSLFFBQVU7QUFBQSxFQUNWLFNBQVc7QUFBQSxFQUNYLFNBQVc7QUFBQSxJQUNULEtBQUs7QUFBQSxNQUNILFNBQVc7QUFBQSxNQUNYLFFBQVU7QUFBQSxNQUNWLE9BQVM7QUFBQSxJQUNYO0FBQUEsSUFDQSxrQkFBa0I7QUFBQSxFQUNwQjtBQUFBLEVBQ0EsZUFBaUI7QUFBQSxJQUNmLFFBQVU7QUFBQSxJQUNWLFVBQVk7QUFBQSxFQUNkO0FBQUEsRUFDQSxpQkFBbUI7QUFBQSxJQUNqQixhQUFhO0FBQUEsSUFDYixRQUFVO0FBQUEsSUFDVixZQUFjO0FBQUEsSUFDZCxNQUFRO0FBQUEsSUFDUixtQkFBbUI7QUFBQSxJQUNuQixRQUFVO0FBQUEsRUFDWjtBQUFBLEVBQ0EsYUFBZTtBQUFBLEVBQ2YsY0FBZ0I7QUFBQSxJQUNkLHVCQUF1QjtBQUFBLElBQ3ZCLDJCQUEyQjtBQUFBLElBQzNCLGdCQUFnQjtBQUFBLElBQ2hCLGNBQWM7QUFBQSxJQUNkLGdCQUFnQjtBQUFBLElBQ2hCLE1BQVE7QUFBQSxFQUNWO0FBQ0Y7OztBRHZDQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUE7QUFBQSxJQUVQLElBQUk7QUFBQSxNQUNGLFFBQVE7QUFBQSxNQUNSLGdCQUFnQjtBQUFBLE1BQ2hCLFdBQVc7QUFBQSxJQUNiLENBQUM7QUFBQSxFQUNIO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFRQSxPQUFPO0FBQUEsSUFDTCxpQkFBaUI7QUFBQSxNQUNmLFNBQVMsQ0FBQztBQUFBLElBQ1o7QUFBQSxJQUNBLEtBQUs7QUFBQTtBQUFBLE1BRUgsT0FBTztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ04sVUFBVTtBQUFBO0FBQUE7QUFBQSxNQUdWLFNBQVMsQ0FBQyxNQUFNLEtBQUs7QUFBQSxJQUN2QjtBQUFBLElBQ0EsZUFBZTtBQUFBO0FBQUEsTUFFYixVQUFVLENBQUMsR0FBRyxPQUFPLEtBQUssZ0JBQUksZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO0FBQUEsTUFDakQsUUFBUTtBQUFBLFFBQ04saUJBQWlCO0FBQUEsTUFDbkI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
