import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";

import tsconfigPaths from "vite-tsconfig-paths";
import path from 'path';


// NB(bt): This configuration file can specify bundler rollup options, compiler plugins,
// import path resolution, dev server HTTP headers, CORS options, path rewriting, etc.
// Read the vite docs for more: https://vitejs.dev/config/

export default defineConfig({
  server: {
    port: 5741,
    headers: {},
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    }
  },

  plugins: [
    tsconfigPaths(),
    react({
      babel: {
        plugins: [["module:@preact/signals-react-transform"]],
      },
    }),
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/onnxruntime-web/dist/*.wasm",
          dest: "wasm/",
        },
        {
          src: "src/KonvaApp/SharedWorkers/Diffusion/DiffusionSharedWorker.js",
          dest: "assets/workers/",
        },
      ],
    }),
    {
      name: "wasm-mime-type",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.endsWith(".onnx")) {
            res.setHeader("Content-Type", "application/wasm");
          }
          next();
        });
      },
    },
  ],
  assetsInclude: ["**/.onnx", "**/*.wasm"],
});
