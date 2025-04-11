import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { netlifyPlugin } from "@netlify/remix-edge-adapter/plugin";
import { viteCommonjs, esbuildCommonjs } from '@originjs/vite-plugin-commonjs'
import path from 'path'

export default defineConfig({
  //build: {
  //},
  //resolve: {
  //  alias: {
  //    'kalidokit': `${path.resolve(__dirname, 'src')}/`,
  //  },
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
  plugins: [
    remix(),
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
