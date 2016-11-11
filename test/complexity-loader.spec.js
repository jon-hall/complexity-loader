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
      { test: /\.js$/, loaders: [LOADER_PATH], exclude: /node_modules/ }
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
          // There should be three reports in the result (basic, complex, and complex2)
          expect(reportsArg.modules.length).to.equal(3)

          // We want the second report in the set - the complex report
          const complexReport = reportsArg.modules[1]
          expect(complexReport).to.exist

          // We want the lest report in the set - the complex2 report
          const complex2Report = reportsArg.modules[2]
          expect(complex2Report).to.exist
        })
      })

      function checkRaw (report, {
        cyclomaticTotal,
        slocLogicalTotal,
        slocPhysicalTotal,
        cyclomatic
      }) {
        expect(report.methodAggregate.cyclomatic).to.equal(cyclomaticTotal)
        expect(report.methodAggregate.sloc.logical).to.equal(slocLogicalTotal)
        expect(report.methodAggregate.sloc.physical).to.equal(slocPhysicalTotal)
        expect(report.methodAverage.cyclomatic).to.equal(cyclomatic)
      }

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
            // There should be three reports in the result (basic, complex, and complex2)
            expect(reportsArg.modules.length).to.equal(3)

            // Check the first module in the report ('basic.js')
            const basicReport = reportsArg.modules[0]
            expect(basicReport).to.exist
            expect(basicReport.methods.length).to.equal(2)

            checkRaw(basicReport, reportExpectations.basic)

            // Check the second module in the report ('complex.js')
            const complexReport = reportsArg.modules[1]
            expect(complexReport).to.exist
            checkRaw(complexReport, reportExpectations.complex)

            // Check the final module in the report ('complex2.js')
            const complex2Report = reportsArg.modules[2]
            expect(complex2Report).to.exist
            checkRaw(complex2Report, reportExpectations.complex2)
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
            expect(reportsArg.files).to.equal(3)

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
            expect(reportsArg.files.length).to.equal(3)

            const basicReport = reportsArg.files.find(fileReport => /basic\.js/.test(fileReport.filename))
            expect(basicReport).to.exist
            checkSummary(basicReport, reportExpectations.basic)

            const complexReport = reportsArg.files.find(fileReport => /complex\.js/.test(fileReport.filename))
            expect(complexReport).to.exist
            checkSummary(complexReport, reportExpectations.complex)

            const complex2Report = reportsArg.files.find(fileReport => /complex2\.js/.test(fileReport.filename))
            expect(complex2Report).to.exist
            checkSummary(complex2Report, reportExpectations.complex2)

            // We should have file average stats under an 'averages' node
            expect(reportsArg.averages).to.exist

            // containing maintanability, method complexity, method halstead, and sloc
            checkSummary(reportsArg.averages, reportExpectations.moduleAverages)
          })
        })

        describe('and we use a preprocessor loader (babel-loader)', function () {
          it('then it should still compile and emit the expected reports', async function () {
            const stats = await compile(
              ['./basic.babel.js', './complex.babel.js'],
              mergeWith({}, CONFIG_BASIC, {
                module: {
                  loaders: [{
                    test: /\.js$/,
                    loaders: ['babel', LOADER_PATH],
                    exclude: /node_modules/
                  }]
                },
                babel: {
                  presets: ['stage-0', 'latest']
                }
              })
            )

            expect(stats).to.exist
            expect(reporter.callCount).to.equal(1)

            const firstCallArgs = reporter.args[0]
            expect(firstCallArgs).to.exist

            const reportsArg = firstCallArgs[0]
            expect(reportsArg).to.exist

            // 'files' should now be an array with a sub-report for each file
            expect(reportsArg.files.length).to.equal(3)

            // Now confirm the report comes out the same for each file despite babel being involved
            // (barring the async keyword and using import/export instead of require, the files are
            // identical in terms of sloc, complexity etc.)
            const basicReport = reportsArg.files.find(fileReport => /basic\.babel\.js/.test(fileReport.filename))
            expect(basicReport).to.exist
            checkSummary(basicReport, reportExpectations.basic)

            const complexReport = reportsArg.files.find(fileReport => /complex\.babel\.js/.test(fileReport.filename))
            expect(complexReport).to.exist
            checkSummary(complexReport, reportExpectations.complex)

            const complex2Report = reportsArg.files.find(fileReport => /complex2\.babel\.js/.test(fileReport.filename))
            expect(complex2Report).to.exist
            checkSummary(complex2Report, reportExpectations.complex2)

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
