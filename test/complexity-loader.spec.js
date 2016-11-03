import path from 'path'

import { expect } from 'chai'

import MemoryFileSystem from 'memory-fs'
import mergeWith from 'lodash.mergewith'
import webpack from 'webpack'

const TEST_BASE = __dirname
const LOADER_PATH = path.join(__dirname, '../src/index.js')
const OUTPUT_FILE_SYSTEM = new MemoryFileSystem()
const CONFIG_BASIC = {
  context: path.join(TEST_BASE, 'examples'),
  output: {
    path: path.resolve(TEST_BASE, 'output'),
    filename: 'output.js'
  },
  module: {
    loaders: [
      { test: /\.js$/, loader: LOADER_PATH }
    ]
  }
}

async function compile (entry, config = CONFIG_BASIC) {
  const mergedConfig = mergeWith(config, { entry }, () => {})
  const compiler = webpack(mergedConfig)

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
    const stats = await compile(['./basic.js'])
    expect(stats).to.exist
    expect(stats.compilation.errors.length).to.equal(0)
    expect(stats.compilation.warnings.length).to.equal(0)
  })
})
