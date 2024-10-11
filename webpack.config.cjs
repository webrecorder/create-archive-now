const path = require("path");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const package_json = require("./package.json");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

module.exports = {
  mode: "development",
  entry: {
    main: "src/index.ts"
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name].js",
    clean: true
  },
  resolve: {
    extensions: [".ts", ".js"],
    plugins: [new TsconfigPathsPlugin()],
  },

  //devtool: argv.mode === "production" ? undefined : "source-map",

  devServer: {
    compress: true,
    port: 10001,
    open: true,
    static: __dirname,
    hot: true,
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        include: path.resolve(__dirname, "src"),
        options: {
          onlyCompileBundledFiles: false,
        },
      },
    ],
  },

  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "./node_modules/\@webrecorder/archivewebpage/dist/embed/ui.js", to: "../ui.js" },
        { from: "./node_modules/\@webrecorder/archivewebpage/dist/embed/replay/sw.js", to: "../replay/sw.js" }
      ],
    }),
    new HtmlWebpackPlugin({
      title: "Archive Now",
      template: "src/index.ejs",
      inject: "head",
      scriptLoading: "blocking"
    })
  ]
};
