import path from 'path';

export default {
  mode: 'production',
  entry: './src-webpack/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve('./dist-webpack'),
  },
  stats: {
    preset: 'normal',
  },
}; 