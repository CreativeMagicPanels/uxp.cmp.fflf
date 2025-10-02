const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const WebpackObfuscator = require('webpack-obfuscator');

module.exports = merge(common, {
  mode: 'production',

  // optimization: {
  //   splitChunks: {
  //     cacheGroups: {
  //       commons: {
  //         test: /[\\/]node_modules[\\/]/,
  //         name: 'vendors',
  //         filename: 'vendors.js',
  //         chunks: 'all'
  //       }
  //     }
  //   }
  // },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        enforce: "post",
        use: {
          loader: WebpackObfuscator.loader,
          options: {
            compact: false,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0,
            disableConsoleOutput: false,
            numbersToExpressions: false,
            simplify: true,
            shuffleStringArray: true,
            splitStrings: false,
            stringArrayThreshold: 0,
            deadCodeInjection: false,
            selfDefending: false,
            debugProtection: false
          }
        }
      }
    ],
  },

  // plugins: []
});
