const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

const isDev = process.env.NODE_ENV !== 'production';
const publicPath = path.join(process.env.MOUNT_PATH, 'build/');

const config = module.exports = {
  entry: {
    index: './frontend/index.js'
  },
  output: {
    path: path.join(__dirname, 'build'),
    publicPath: publicPath,
    filename: '[name].js',
    libraryTarget: "var",
    library: 'App'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.resolve(__dirname, 'frontend'),
        use: [
          {loader: 'babel-loader', options: {babelrc: true}}
        ]
      },
      {
        test: /\.css$/,
        use: [
          {loader: 'style-loader', options: {sourceMap: isDev}},
          {loader: 'css-loader', options: {modules: false}},
        ]
      },
      {
        test: /\.(eot|ttf|woff(2)?)(\?v=\d+\.\d+\.\d+)?/,
        use: [
          {loader: 'file-loader', options: {publicPath, name: 'fonts/[name].[ext]'}}
        ]
      },
      {
        test: /\.(ico|gif|png|jpg|jpeg|svg)$/,
        use: [
          {loader: 'file-loader', options: {publicPath, name: 'images/[name].[ext]'}}
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.js']
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify(process.env.NODE_ENV)
      }
    }),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      filename: 'vendor.js',
      minChunks: function (module) {
        return /node_modules/.test(module.resource);
      }
    })
  ]
};

if (isDev) {
  config.devtool = 'inline-source-map';
} else {
  config.plugins.push(new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: false
    }
  }));
}
