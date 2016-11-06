import path from 'path'

import { expect } from 'chai'
import sinon from 'sinon'

import MemoryFileSystem from 'memory-fs'
import mergeWith from 'lodash.mergewith'
import webpack from 'webpack'

import * as reportExpectations from './report-expectations.js'

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
          expect(reportsArg.modules.length).to.equal(1)

          // We want the first (and only) report in the set
          const basicReport = reportsArg.modules[0]
          expect(basicReport).to.exist
        })
      })

      describe('and we compile multiple files', function () {
        it('then it should call the reporter once with the complexity results', async function () {
          const stats = await compile(['./basic.js', './complex.js'])
          expect(stats).to.exist
          expect(reporter.callCount).to.equal(1)

          const firstCallArgs = reporter.args[0]
          expect(firstCallArgs).to.exist

          const reportsArg = firstCallArgs[0]
          expect(reportsArg).to.exist
          // There should be two reports in the result
          expect(reportsArg.modules.length).to.equal(2)

          // We want the second report in the set - the complex report
          const complexReport = reportsArg.modules[1]
          expect(complexReport).to.exist
        })
      })

      describe('and we use the default ("raw") level for the report', function () {
        describe('and we compile multiple files', function () {
          it('then it should call the reporter with the raw typhonjs-escomplex reports', async function () {
            const stats = await compile(['./basic.js', './complex.js'])
            expect(stats).to.exist
            expect(reporter.callCount).to.equal(1)

            const firstCallArgs = reporter.args[0]
            expect(firstCallArgs).to.exist

            const reportsArg = firstCallArgs[0]
            expect(reportsArg).to.exist
            // There should be two reports in the result
            expect(reportsArg.modules.length).to.equal(2)

            // Check the first module in the report ('basic.js')
            const basicReport = reportsArg.modules[0]
            expect(basicReport).to.exist
            expect(basicReport.methods.length).to.equal(2)

            // TODO: Rework these tests so we don't have hard-coded stats for the examples everywhere!!
            // While getting the values from escomplex would seem sensible, for the tests where the
            // results are then processed, we'd just be replicating the processing logic in the tests...
            expect(basicReport.methodAggregate.cyclomatic).to.equal(6)
            expect(basicReport.methodAggregate.sloc.logical).to.equal(12)
            expect(basicReport.methodAggregate.sloc.physical).to.equal(22)
            expect(basicReport.methodAverage.cyclomatic).to.equal(3.5)

            // Check the second module in the report ('complex.js')
            const complexReport = reportsArg.modules[1]
            expect(complexReport).to.exist
            expect(complexReport.classes[0].methodAggregate.cyclomatic).to.equal(13)
            expect(complexReport.classes[0].methodAggregate.sloc.logical).to.equal(29)
            expect(complexReport.classes[0].methodAggregate.sloc.physical).to.equal(48)
            expect(complexReport.classes[0].methodAverage.cyclomatic).to.equal(7)
          })
        })
      })

      function checkSummary (summary, {
        maintanability,
        cyclomatic,
        halsteadBugs,
        halsteadDifficulty,
        slocPhysical,
        slocLogical
      }) {
        expect(summary.maintainability).to.equal(maintanability)
        expect(summary.methods).to.exist
        expect(summary.methods.cyclomatic).to.equal(cyclomatic)
        expect(summary.methods.halstead).to.exist
        expect(summary.methods.halstead.bugs).to.equal(halsteadBugs)
        expect(summary.methods.halstead.difficulty).to.equal(halsteadDifficulty)
        expect(summary.methods.sloc).to.exist
        expect(summary.methods.sloc.physical).to.equal(slocPhysical)
        expect(summary.methods.sloc.logical).to.equal(slocLogical)
      }

      describe('and we use the "project" level for the report', function () {
        beforeEach(function () {
          CONFIG_BASIC.complexity.level = 'project'
        })

        describe('and we compile multiple files', function () {
          it('then it should call the reporter with a summary for the entire project', async function () {
            const stats = await compile(['./basic.js', './complex.js'])
            expect(stats).to.exist
            expect(reporter.callCount).to.equal(1)

            const firstCallArgs = reporter.args[0]
            expect(firstCallArgs).to.exist

            const reportsArg = firstCallArgs[0]
            expect(reportsArg).to.exist
            // 'files' should just be a count of how many files were processed
            expect(reportsArg.files).to.equal(2)

            // We should have file average stats under an 'averages' node
            expect(reportsArg.averages).to.exist

            // containing maintanability, method complexity, method halstead, and sloc
            checkSummary(reportsArg.averages, reportExpectations.moduleAverages)
          })
        })
      })

      describe('and we use the "file" level for the report', function () {
        beforeEach(function () {
          CONFIG_BASIC.complexity.level = 'file'
        })

        describe('and we compile multiple files', function () {
          it('then it should call the reporter with a summary for the entire project, and a ' +
            'summary for each file in the project', async function () {
            const stats = await compile(['./basic.js', './complex.js'])
            expect(stats).to.exist
            expect(reporter.callCount).to.equal(1)

            const firstCallArgs = reporter.args[0]
            expect(firstCallArgs).to.exist

            const reportsArg = firstCallArgs[0]
            expect(reportsArg).to.exist

            // 'files' should now be an array with a sub-report for each file
            expect(reportsArg.files.length).to.equal(2)

            const basicReport = reportsArg.files.find(fileReport => /basic\.js/.test(fileReport.filename))
            expect(basicReport).to.exist
            checkSummary(basicReport, reportExpectations.basic)

            const complexReport = reportsArg.files.find(fileReport => /complex\.js/.test(fileReport.filename))
            expect(complexReport).to.exist
            checkSummary(complexReport, reportExpectations.complex)

            // We should have file average stats under an 'averages' node
            expect(reportsArg.averages).to.exist

            // containing maintanability, method complexity, method halstead, and sloc
            checkSummary(reportsArg.averages, reportExpectations.moduleAverages)
          })
        })
      })
    })
  })
})
