const path = require("path");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const package_json = require("./package.json");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  mode: "development",
  entry: {
    main: "src/index.ts",
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
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
        include: path.resolve(__dirname, "src"),
        use: [
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                syntax: "postcss-lit",
                plugins: ["tailwindcss", "autoprefixer"],
              },
            },
          },
          {
            loader: "ts-loader",
            options: {
              onlyCompileBundledFiles: true,
              transpileOnly: true,
            },
          },
        ],
      },
      {
        test: /\.css$/i,
        // include: [
        //   path.resolve(__dirname, "src"),
        //   path.resolve(__dirname, "node_modules/@shoelace-style/shoelace"),
        // ],
        use: [
          MiniCssExtractPlugin.loader,
          { loader: "css-loader", options: { importLoaders: 1 } },
          "postcss-loader",
        ],
      },
    ],
  },

  plugins: [
    // doing this separately for now
    //new CopyPlugin({
    //  patterns: [
    //    { from: "./node_modules/\@webrecorder/archivewebpage/dist/embed/ui.js", to: "../awp-ui.js" },
    //    { from: "./node_modules/\@webrecorder/archivewebpage/dist/embed/replay/sw.js", to: "../replay/sw.js" }
    //  ],
    //}),
    new MiniCssExtractPlugin(),
    new CopyPlugin({
      patterns: [
        // Copy Shoelace assets to dist/shoelace
        {
          from: path.resolve(
            __dirname,
            "node_modules/@shoelace-style/shoelace/dist/assets",
          ),
          to: path.resolve(__dirname, "dist/shoelace/assets"),
        },
      ],
    }),
    new HtmlWebpackPlugin({
      title: "Archive Now",
      template: "src/index.ejs",
      inject: "head",
      scriptLoading: "blocking",
    }),
  ],
};
