const path = require("path");
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

const BANNER = `[name].js is part of the Webrecorder Create Archive Now! (CAN!) (https://create.webrecorder.net/) Copyright (C) 2024-${new Date().getFullYear()}, Webrecorder Software. Licensed under the Affero General Public License v3.`;


/** @type {import('webpack').Configuration} */
module.exports = (env, argv) => {
  return {
    mode: env.production ? "production" : "development",
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
      plugins: [
        new TsconfigPathsPlugin(),
      ],
    },

    //devtool: argv.mode === "production" ? undefined : "source-map",
    devServer: {
      compress: true,
      port: 10001,
      open: true,
      static: path.join(__dirname, "dist"),
      hot: true,
    },

    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          extractComments: false,
        }),
      ],
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
          // Global styles and assets, like fonts and Shoelace,
          // that get added to document styles
          test: /\.css$/i,
          include: [
            path.resolve(__dirname, "src"),
            path.resolve(__dirname, "node_modules/@shoelace-style/shoelace"),
          ],
          exclude: /\.stylesheet\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            { loader: "css-loader", options: { importLoaders: 1 } },
            "postcss-loader",
          ],
        },
        {
          // CSS loaded as raw string and used as a CSSStyleSheet
          test: /\.stylesheet\.css$/,
          type: "asset/source",
          include: [path.resolve(__dirname, "src")],
          use: ["postcss-loader"],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif|avif)$/i,
          type: "asset/resource",
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
      new webpack.BannerPlugin(BANNER),
      new ForkTsCheckerWebpackPlugin({}),
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
          {
            from: "./node_modules/@webrecorder/archivewebpage/dist/embed/ui.js",
            to: path.resolve(__dirname, "dist/awp-ui.js"),
          },
          {
            from: "./node_modules/@webrecorder/archivewebpage/dist/embed/replay/sw.js",
            to: path.resolve(__dirname, "dist/replay/sw.js"),
          },
        ],
      }),
      new HtmlWebpackPlugin({
        template: "src/index.ejs",
        templateParameters: {
          production: env.production,
          title: "Create Archive Now • Webrecorder",
          description:
            "Create Archive Now, a demo of Webrecorder’s web archiving tools",
          baseUrl: "https://create.webrecorder.net",
          homeUrl: "https://create.webrecorder.net",
          // optional landing site url if no hashtag provided
          landingSiteUrl: process.env.LANDING_SITE_URL,
        },
        inject: "head",
        scriptLoading: "blocking",
      }),
    ],
  };
};
