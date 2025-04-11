const path = require("path");
const { getLoader, loaderByName } = require("@craco/craco");
const HtmlWebpackPlugin = require('html-webpack-plugin');

const packages = [];
packages.push(path.join(__dirname, "../components"));

// NB: Either `fakeyou` or `storyteller`
// This build switch controls which HTML template to use.
const website = process.env.WEBSITE || "fakeyou"

console.log(`environment website: ${website}`);

const indexTemplate = website === "fakeyou" ?
    'public/index_fakeyou.html' :
    'public/index_storyteller.html';

console.log(`index template: ${indexTemplate}`);

module.exports = {
  paths: {
    appHtml: indexTemplate,
  },
  devServer: {
    // These are dev-only headers meant to help with CORS in development, specifically
    // for integration with SSO providers that require certain CORS headers.
    headers: {
      // Make it easy to find where we set headers in config
      'X-Custom-Create-React-App-Header': 'GrepForThis',
      // Google SSO:
      // Cross-Origin-Opener-Policy policy would block the window.postMessage call.
      //'Cross-Origin-Opener-Policy': 'same-origin-allow-popups', // NB: Before 9-19
      // https://stackoverflow.com/a/77297872
      'Cross-Origin-Opener-Policy': 'unsafe-none',
    },
  },
  webpack: {
    plugins: {
      remove:  [
        "HtmlWebpackPlugin",
        "InterpolateHtmlPlugin ",
        "InlineChunkHtmlPlugin",
      ],
      add: [
        new HtmlWebpackPlugin({
          // Dynamically set which index.html file is used in the build or serve step.
          template: path.resolve(__dirname, indexTemplate),
          // This is the output filename, which we shouldn't need to change:
          // filename: 'index.html',
        }),
      ],
    },
    configure: (webpackConfig, arg) => {
      const { isFound, match } = getLoader(
        webpackConfig,
        loaderByName("babel-loader")
      );
      if (isFound) {
        const include = Array.isArray(match.loader.include)
          ? match.loader.include
          : [match.loader.include];

        match.loader.include = include.concat(packages);
      }
      return webpackConfig;
    },
  },
};
