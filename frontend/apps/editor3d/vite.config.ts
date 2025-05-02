import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { netlifyPlugin } from "@netlify/remix-edge-adapter/plugin";
import { viteCommonjs, esbuildCommonjs } from '@originjs/vite-plugin-commonjs'
import path from 'path'
import { dirname, resolve } from 'node:path'

// NB(bt): This configuration file can specify bundler rollup options, compiler plugins,
// dev server HTTP headers, CORS options, path rewriting, etc. Read the vite docs for more.
export default defineConfig({
  root: path.resolve(__dirname, 'app'),
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'app/index.html'),
        login: resolve(__dirname, 'app/login.html'),
        signup: resolve(__dirname, 'app/signup.html'),
      },
    },
  },
  plugins: [
    netlifyPlugin(),
    tsconfigPaths(),
  ],
  server: {
  }
});
