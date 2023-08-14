import type { Configuration } from 'webpack';
import { IgnorePlugin } from 'webpack';

import { rules } from './webpack.rules';

const optionalPlugins: any[] = [];
if (process.platform !== "darwin") { // don't ignore on OSX
  optionalPlugins.push(new IgnorePlugin({ resourceRegExp: /readable-stream\/transform/ }));
}

export const mainConfig: Configuration = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/index.ts',
  // Put your normal webpack config below here
  module: {
    rules,
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },
  plugins: [...optionalPlugins]
};
