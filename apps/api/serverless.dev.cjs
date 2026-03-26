const config = require("./serverless.cjs");

module.exports = {
  ...config,
  plugins: ["serverless-esbuild", "serverless-offline"],
};

