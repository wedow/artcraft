const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function expressMiddleware(router) {
  router.use(
    "/v1",
    createProxyMiddleware({
      target: "https://api.storyteller.ai/v1",
      changeOrigin: true,
      on: {
        proxyReq: async (req, res) => {
          req.setHeader("Access-Control-Allow-Origin", "*");
          req.setHeader("Origin", "http://localhost:5173");
          req.setHeader("Referer", "http://localhost:5173");
        },
      },
      logger: console,
    }),
  );
  router.use(
    "/cdn-cgi",
    createProxyMiddleware({
      target: "https://cdn.storyteller.ai/cdn-cgi",
      changeOrigin: true,
      on: {
        proxyReq: async (req, res) => {
          req.setHeader("Access-Control-Allow-Origin", "*");
          req.setHeader("Origin", "http://localhost:5173");
          req.setHeader("Referer", "http://localhost:5173");
        },
      },
      logger: console,
    }),
  );
};
