const path = require('path');
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const config = {
  entry: {
    index: './resource/js/index.js',
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
            loader: 'babel-loader',
            options: {
              presets: ['env']
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin (),
    // new webpack.optimize.CommonsChunkPlugin({
    //   name: 'vendor',
    //   chunks: ['index'],
    // }),
  ]
};

if (process.env.NODE_ENV === 'development') {
  config.devtool = '#cheap-module-source-map';
  config.devServer = {
    contentBase: path.join(__dirname, 'webroot'),
    hot: true,
    inline: true,
    watchContentBase: true
  };
  config.plugins.push(new webpack.HotModuleReplacementPlugin());
} else {
  config.plugins.push(new BundleAnalyzerPlugin());
  config.plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      mangle: true,
      compress: {
        drop_console: true
      },
    })
  );
  config.module.rules.push({
    enforce: 'pre',
    test: /\.js$/,
    exclude: /node_modules/,
  });
}

module.exports = config;
