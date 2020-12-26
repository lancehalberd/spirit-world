const path = require('path');

module.exports = {
  entry: './app/client.ts',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.(ts|js)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [ '.ts', '.js' ],
    alias: {
      'app': path.resolve(__dirname, 'app')
    },
  },
  output: {
    filename: 'client.js',
    path: path.resolve(__dirname, 'public'),
  },
};
