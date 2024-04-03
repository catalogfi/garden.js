import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import * as path from "path";
// import pkg from "./package.json";

export default defineConfig({
    plugins: [
        // nodePolyfills(),
        dts({
            outDir: "./dist",
            pathsToAliases: false,
            entryRoot: ".",
        }),
    ],
    // Configuration for building your library.
    // See: https://vitejs.dev/guide/build.html#library-mode
    build: {
        commonjsOptions: {
            include: [],
        },
        lib: {
            // Could also be a dictionary or array of multiple entry points.
            entry: "src/index.ts",
            name: "package-b",
            fileName: "index",
            // Change this to the formats you want to support.
            // Don't forget to update your package.json as well.
            formats: ["es", "cjs"],
        },
        rollupOptions: {
            // External packages that should not be bundled into your library.
            external: [],
            output: {
                // preserveModules: true,
            },
        },
    },
});
