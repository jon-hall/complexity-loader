import path from 'path'

import webpack from 'webpack'
import nodeExternals from 'webpack-node-externals'
import mergeWith from 'lodash.mergewith'

export default function(cfg) {
    return mergeWith({
        entry: path.join(__dirname, '../src/index.js'),
        output: {
            path: path.join(__dirname, '../lib'),
            filename: 'index.js'
        },
        devtool: 'sourcemap',
        target: 'node',
        node: {
          __dirname: false,
          __filename: false,
        },
        externals: [
          nodeExternals({ modulesDir: path.join(__dirname, '../node_modules') })
        ],
        module: {
            loaders: [{
                test: /\.js$/,
                loaders: ["babel-loader", "eslint-loader"]
            }]
        },
        plugins: [
          new webpack.BannerPlugin(
              'require("source-map-support").install();',
              { raw: true, entryOnly: false }
          )
        ]
    }, cfg, function(objValue, srcValue) {
        if(Array.isArray(objValue)) {
            // Combine arrays
            return objValue.concat(srcValue)
        }
    })
}
