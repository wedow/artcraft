import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { netlifyPlugin } from "@netlify/remix-edge-adapter/plugin";
import { viteCommonjs, esbuildCommonjs } from '@originjs/vite-plugin-commonjs'
import path from 'path'
import { dirname, resolve } from 'node:path'

export default defineConfig({
  root: path.resolve(__dirname, 'app'),
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
