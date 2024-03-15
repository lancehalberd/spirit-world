const path = require('path');
const CircularDependencyPlugin = require('circular-dependency-plugin');

module.exports = {
  entry: './app/client.ts',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.(ts|js)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
        include: /app/,
      },
    ],
  },
  plugins: [
    new CircularDependencyPlugin({
      exclude: /tsc|node_modules/,
      include: /app/,
      failOnError: false,
      // set the current working directory for displaying module paths
      cwd: process.cwd(),
    })
  ],
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
