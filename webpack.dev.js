const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');

module.exports = merge(common, {
  mode: 'development',
	// won't work on XD due to lack of eval
  // devtool: 'eval-cheap-module-source-map', // slightly faster
  devtool: 'eval-source-map',
});
