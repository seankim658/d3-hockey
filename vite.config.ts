import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "D3Hockey",
      fileName: (format) => `d3-hockey.${format}.js`,
      formats: ["es", "umd"],
    },
    rollupOptions: {
      external: ["d3"],
      output: {
        globals: {
          d3: "d3",
        },
      },
    },
  },
});
