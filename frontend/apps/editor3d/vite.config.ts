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
    proxy: {
      // Example: rewrite /@fs/path/to/wasm/* -> /wasm/*
      //'^/@fs/.vite/deps/spark_internal_rs_bg.wasm': {
      '^/@fs/.*vite/deps/.*.wasm$': {
        target: 'http://localhost:5173',  // or another backend
        //rewrite: (path) =>
        //  path.replace(/^\/@fs\/path\/to\/wasm\//, '/Users/bt/dev/storyteller/storyteller-rust/frontend/vendor/spark/rust/spark-internal-rs/pkg/spark_internal_rs_bg.wasm'),
        rewrite: (path) => {
          const p = '/@fs/Users/bt/dev/storyteller/storyteller-rust/frontend/vendor/spark/rust/spark-internal-rs/pkg/spark_internal_rs_bg.wasm';
          console.log('path', p);
          // http://localhost:5173/@fs/Users/bt/dev/storyteller/storyteller-rust/frontend/apps/editor3d/node_modules/.vite/deps/spark_internal_rs_bg.wasm

          const replaced = path.replace('storyteller-rust/frontend/apps/editor3d/node_modules/.vite/deps/', 'storyteller-rust/frontend/vendor/spark/rust/spark-internal-rs/pkg/');
          console.log('replaced', replaced);
          return replaced;
        },
        changeOrigin: true,
      },
    },
  }
});
