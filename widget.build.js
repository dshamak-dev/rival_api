const esbuild = require("esbuild");
// const { copy } = require("esbuild-plugin-copy");
// const CssModulesPlugin = require("esbuild-css-modules-plugin");
// const postcss = require('esbuild-postcss');

// const isProd = process.argv.includes("--production");
const watch = process.argv.includes("--watch");
const minify = process.argv.includes("--minify");

const config = {
  entryPoints: ["./src/client/index.ts"],
  bundle: true,
  outfile: "./public/widget.js",
  minify: minify,
  plugins: [],
};

if (watch) {
  config.plugins.push({
    name: "watch-plugin",
    setup(build) {
      build.onStart(() => {
        console.clear();
      });
      build.onEnd((result) => {
        if (result?.errors?.length) {
          // console.log('build errors', result.errors);
        } else {
          console.log('watching...');
        }
      });
    },
  });
}

async function run() {
  if (watch) {
    // args.minify = false;
    try {
      ctx = await esbuild.context(config);
      await ctx.watch();
      // console.log("watching...");
    } catch (error) {
      console.log("error", error);
    }
  } else {
    // args.minify = true;
    ctx = await esbuild.build(config);
    console.log("build successful");
  }
}

run();
