import CopyPlugin from 'copy-webpack-plugin';
import type IForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import * as path from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

export const plugins = [
  new ForkTsCheckerWebpackPlugin({
    logger: 'webpack-infrastructure',
  }),
  /*new CopyPlugin({ patterns: [{
    from: path.resolve(__dirname, "public"),
    to: path.resolve(__dirname, ".webpack/public")
  }]})*/
];