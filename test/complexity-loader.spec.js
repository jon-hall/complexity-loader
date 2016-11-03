import path from 'path'

import { expect } from 'chai'
import sinon from 'sinon'

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
  describe('when we use the loader with webpack', function () {
    it('then it should still allow a basic file to compile', async function () {
      const stats = await compile(['./basic.js'])
      expect(stats).to.exist
      expect(stats.compilation.errors.length).to.equal(0)
      expect(stats.compilation.warnings.length).to.equal(0)
    })

    describe('and we use the "memory" reporter', function () {
      let reporter

      beforeEach(function () {
        reporter = sinon.spy()

        // TODO: Test an array of reporters when we have multiple
        CONFIG_BASIC.complexity = {
          reporter
        }
      })

      describe('and we compile a basic file', function () {
        it('then it should call the reporter with the complexity results', async function () {
          const stats = await compile(['./basic.js'])
          expect(stats).to.exist
          expect(reporter.callCount).to.equal(1)

          const firstCallArgs = reporter.args[0]
          expect(firstCallArgs).to.exist

          const reportsArg = firstCallArgs[0]
          expect(reportsArg).to.exist
          // There should be one report in the result
          expect(reportsArg.length).to.equal(1)

          // We want the first (and only) report in the set
          const basicReport = reportsArg[0]
          expect(basicReport).to.exist
          expect(basicReport.methods.length).to.equal(2)
          expect(basicReport.methodAggregate.cyclomatic).to.equal(6)
          expect(basicReport.methodAggregate.sloc.logical).to.equal(12)
          expect(basicReport.methodAggregate.sloc.physical).to.equal(22)
          expect(basicReport.methodAverage.cyclomatic).to.equal(3.5)
        })
      })

      describe('and we compile multiple files', function () {
        it('then it should call the reporter once with the complexity results', async function () {
          const stats = await compile(['./basic.js', './complex.js'])
          expect(stats).to.exist
          expect(reporter.callCount).to.equal(1)
        })
      })
    })
  })
})
