import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { netlifyPlugin } from "@netlify/remix-edge-adapter/plugin";
import { viteCommonjs, esbuildCommonjs } from '@originjs/vite-plugin-commonjs'
import path from 'path'
import { dirname, resolve } from 'node:path'

export default defineConfig({
  root: __dirname,
  //build: {
  //},
  //resolve: {
  //  alias: {
  //    'kalidokit': `${path.resolve(__dirname, 'src')}/`,
  //  },
  //},
  //resolve: {
  //  alias: [
  //    {
  //      find: /@frontend\/login/,
  //      //replacement: path.resolve(__dirname, 'node_modules', '@frontend', 'login'),
  //      replacement: path.resolve(__dirname, '../', '../', 'libs', 'login'),
  //    },
  //  ],
  //},
  //rollupOptions: {
  //  // make sure to externalize deps that shouldn't be bundled
  //  // into your library
  //  exports: "named",
  //  external: [],
  //  output: {
  //      // Provide global variables to use in the UMD build
  //      // for externalized deps
  //      globals: {},
  //  },
  //},
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        signup: resolve(__dirname, 'signup.html'),
        //nested: resolve(__dirname, 'nested/index.html'),
      },
    },
  },
  plugins: [
    netlifyPlugin(),
    tsconfigPaths(),
    //viteCommonjs({
    //  include: ["kalidokit"],
    //}),
    {
      name: "configure-response-headers",
      configureServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
          res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
          next();
        });
      },
    },
  ],
  server: {
    proxy: {
      "/v1": "https://api.storyteller.ai",
      "/avatar": "https://www.gravatar.com",
      "/preview": "https://style.storyteller.ai",
      "/google": {
        target: "https://storage.googleapis.com",
        rewrite: (path) => path.replace(/^\/google/, ""),
      },
    },
  },
  //optimizeDeps: {
  //  esbuildOptions: {
  //    plugins: [
  //      esbuildCommonjs(['kalidokit'])
  //    ]
  //  }
  //}
  optimizeDeps: {
    include: [
      //'vue',
      //'vue-router',
      //'@vueuse/core',
      //'@vueuse/head',
      //'consola',
      //'kalidokit',
    ],
  }
});
