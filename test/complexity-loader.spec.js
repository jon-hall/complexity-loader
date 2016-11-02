import path from 'path'

import { expect } from 'chai'

import webpack from 'webpack'
import MemoryFileSystem from 'memory-fs'
import mergeWith from 'lodash.mergewith'

// Because mocha-webpack is building us into a temp dir, we need to recalculate back to the test dir
const TEST_BASE = path.join(__dirname, '../../../test')
const LOADER_PATH = path.join(__dirname, '../src/index.js')
const OUTPUT_FILE_SYSTEM = new MemoryFileSystem()
const CONFIG_BASIC = {
  output: {
    path: path.resolve(TEST_BASE, 'output'),
    filename: 'output.js'
  },
  module: {
    loaders: [
      { test: /\.js$/, loader: LOADER_PATH }
    ]
  },
  // Webpack keeps trying to load the entry for our main webpack config as our entry point...
  // Why? This *should* be a brand new, clean, compiler that has no connection to our main config...
  resolve: {
    root: path.join(TEST_BASE, 'examples')
  },
  cache: false
}

async function compile (entry, config = CONFIG_BASIC) {
  const mergedConfig = mergeWith(config, { entry }, () => {}),
    compiler = webpack(mergedConfig)

  compiler.outputFileSystem = OUTPUT_FILE_SYSTEM

  return await new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        return reject(err)
      }

      resolve(stats)
    })
  })
}

describe('complexity-loader', function () {
  it('should still allow a basic file to compile', async function () {
    const stats = await compile('basic.js')
    expect(stats).to.exist
    expect(stats.compilation.errors.length).to.equal(0)
    expect(stats.compilation.warnings.length).to.equal(0)
  })
})
