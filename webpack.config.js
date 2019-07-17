const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;

const config = {
  entry: {
    index: './resource/js/index.js'
  },
  output: {
    publicPath: '/js/',
    filename: '[name].bundle.js',
    path: path.join(__dirname, 'webroot/js')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader'
          }
        ]
      }
    ]
  },
  plugins: [new webpack.NoEmitOnErrorsPlugin()],
  optimization: {
    minimizer: []
  }
};

if (process.env.NODE_ENV === 'development') {
  config.mode = 'development';
  config.devtool = '#cheap-module-source-map';
  config.devServer = {
    contentBase: path.join(__dirname, 'webroot'),
    hot: true,
    inline: true,
    watchContentBase: true
  };
  config.plugins.push(new webpack.HotModuleReplacementPlugin());
} else {
  config.mode = 'production';
  config.plugins.push(new BundleAnalyzerPlugin());
  config.optimization.minimizer.push(
    new TerserPlugin({
      terserOptions: {
        compress: { drop_console: true }
      }
    })
  );
  config.module.rules.push({
    enforce: 'pre',
    test: /\.js$/,
    exclude: /node_modules/
  });
}

module.exports = config;
