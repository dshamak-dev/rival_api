const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  entry: "./server.ts",
  mode: process.env.NODE_ENV || "production",

  /** target value is runtime environment
   * 'node' to run code in Node.js-like environment
   * 'web' to run code in a browser-like environment(default)
   */
  target: "node",
  output: {
    filename: "server.js",
  },

  // extractComments 'false' omit output of index.LICENSE.txt
  optimization: {
    minimizer: [new TerserPlugin({ extractComments: false })],
  },

  // with `import A from './foo'`, it resolve A from `./foo.ts` and `.foo.js`
  resolve: {
    extensions: [".ts", ".js"]
  },

  // with `.ts` file, preprocess with `ts-loader`
  module: {
    rules: [{ test: /\.ts$/, use: ["ts-loader"] }],
  },

  // copy src/index.htl to dist/index.html
  plugins: [
    new CopyPlugin({
      patterns: [{ from: "src/index.html", to: "." }],
    }),
  ],
};
