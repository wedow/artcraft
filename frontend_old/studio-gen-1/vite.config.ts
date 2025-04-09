import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { netlifyPlugin } from "@netlify/remix-edge-adapter/plugin";

export default defineConfig({
  plugins: [
    remix(),
    netlifyPlugin(),
    tsconfigPaths(),
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
});
