// This is used to compile the example

const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './index.js',
  output: {
    filename: 'index.js',
    path: path.resolve('lib'),
  },

  plugins: [
      // Work around for Buffer is undefined:
      // https://github.com/webpack/changelog-v5/issues/10
      new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
      }),
      new webpack.ProvidePlugin({
          process: 'process/browser',
      }),
  ],

  module: {
    rules: [{test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'}],
  },
  target: 'web',
  mode: 'production',
};
