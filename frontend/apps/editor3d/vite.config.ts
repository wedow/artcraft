import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from 'path'
import { resolve } from 'node:path'

// NB(bt): This configuration file can specify bundler rollup options, compiler plugins,
// import path resolution, dev server HTTP headers, CORS options, path rewriting, etc.
// Read the vite docs for more: https://vitejs.dev/config/

export default defineConfig({
  root: path.resolve(__dirname, 'app'),
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'app/index.html'),
      },
    },
  },
  plugins: [
    tsconfigPaths(),
  ],
  server: {
  }
});
