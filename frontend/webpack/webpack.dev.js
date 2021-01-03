const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const { prod_Path, src_Path } = require('./path');
const { selectedPreprocessor } = require('./loader');

const fs = require('fs');

const entries = {};
const plugins = [];
fs.readdirSync('src/pages').forEach((filename) => {
  if (!filename.endsWith('.ts')) {
    return;
  }
  const name = filename.split('.')[0];
  (entries[name] = './' + src_Path + '/pages/' + filename),
    plugins.push(
      new HtmlWebpackPlugin({
        inject: true,
        // hash: false,
        // template: './' + src_Path + '/index.html',
        chunks: [name],
        filename: name + '.html',
      })
    );
});

module.exports = {
  entry: entries,
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    path: path.resolve(__dirname, prod_Path),
    filename: '[name].[chunkhash].js',
  },
  devtool: 'source-map',
  devServer: {
    open: true,
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: selectedPreprocessor.fileRegexp,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: 'css-loader',
            options: {
              modules: false,
              sourceMap: true,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true,
            },
          },
          {
            loader: selectedPreprocessor.loaderName,
            options: {
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'style.css',
    }),
    ...plugins,
  ],
};
