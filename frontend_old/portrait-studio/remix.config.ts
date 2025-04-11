import { AppConfig } from '@remix-run/dev';

module.exports = {
  ignoredRouteFiles: ["**/.*"],
  tailwind: true,
  serverModuleFormat: "cjs",
} satisfies AppConfig;