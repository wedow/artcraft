import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";

const app = express();

app.use(cors());

app.use(
  "/v1",
  createProxyMiddleware({
    target: "https://api.storyteller.ai/v1",
    changeOrigin: true,
    secure: true,
    logger: console,
  }),
);

app.use(
  "/google",
  createProxyMiddleware({
    target: "https://storage.googleapis.com",
    changeOrigin: true,
    secure: true,
    // logger: console,
  }),
);

app.use(
  "/funnel",
  createProxyMiddleware({
    // target: "https://funnel.tailce84f.ts.net",
    target: "https://style.storyteller.ai",
    changeOrigin: true,
    secure: true,
    // logger: console,
  }),
);

app.use(
  "/cdn",
  createProxyMiddleware({
    target: "https://cdn.storyteller.ai",
    changeOrigin: true,
    secure: true,
    // logger: console,
  }),
);

app.use(
  "/vocodes",
  createProxyMiddleware({
    target: "https://storage.googleapis.com/vocodes-public",
    changeOrigin: true,
    secure: true,
    // logger: console,
  }),
);

app.use(
  "/gravatar",
  createProxyMiddleware({
    target: "https://www.gravatar.com",
    changeOrigin: true,
    secure: true,
    logger: console,
  }),
);

// app.use(express.json({ limit: "150mb" }));
// app.post("/upload-video", uploadVideo);

app.listen(3000, () => {
  console.log("Listening on port 3000");
});
