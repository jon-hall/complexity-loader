import path from 'path'

import { expect } from 'chai'
import sinon from 'sinon'

import MemoryFileSystem from 'memory-fs'
import mergeWith from 'lodash.mergewith'
import webpack from 'webpack'
import promisedTemp from 'promised-temp'
const temp = promisedTemp.track()
import fs from 'mz/fs'
import stripcolorcodes from 'stripcolorcodes'

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
  const mergedConfig = mergeWith({}, config, { entry }, () => {})
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

describe('complexity-loader', function () {
  let config

  beforeEach(function () {
    config = mergeWith({}, CONFIG_BASIC)
  })

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
        config = mergeWith({}, CONFIG_BASIC, {
          complexity: {
            reporter
          }
        })
      })

      describe('and we compile a basic file', function () {
        it('then it should call the reporter with the complexity results', async function () {
          const stats = await compile(['./basic.js'], config)
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
          const stats = await compile(['./basic.js', './complex.js'], config)
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

      describe('and we use an invalid level for the report', function () {
        describe('and we compile multiple files', function () {
          it('the compilation result should contain an error about the invalid level', async function () {
            const badValues = [(new Date()).toString(), {}, null, [], true, NaN, /regex/, 0, Infinity]

            await Promise.all(
              badValues.map(async (badValue) => {
                const stats = await compile(['./basic.js', './complex.js'], mergeWith({}, config, {
                  complexity: {
                    level: badValue
                  }
                }))

                expect(stats.hasErrors()).to.equal(true)
                expect(stats.compilation.errors[0].toString()).to.have.string('options.level invalid')
              })
            )
          })
        })
      })

      describe('and we use the default ("raw") level for the report', function () {
        beforeEach(function () {
          delete config.complexity.level
        })

        describe('and we compile multiple files', function () {
          it('then it should call the reporter with the raw typhonjs-escomplex reports', async function () {
            const stats = await compile(['./basic.js', './complex.js'], config)
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
          config = mergeWith({}, config, {
            complexity: {
              level: 'project'
            }
          })
        })

        describe('and we compile multiple files', function () {
          it('then it should call the reporter with a summary for the entire project', async function () {
            const stats = await compile(['./basic.js', './complex.js'], config)
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
          config = mergeWith({}, config, {
            complexity: {
              level: 'file'
            }
          })
        })

        describe('and we compile multiple files', function () {
          it('then it should call the reporter with a summary for the entire project, and a ' +
            'summary for each file in the project', async function () {
            const stats = await compile(['./basic.js', './complex.js'], config)
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
              mergeWith({}, config, {
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

    // TODO: Invalid reporter option tests

    describe('and we use the "json" reporter', function () {
      beforeEach(function () {
        config = mergeWith({}, config, {
          complexity: {
            reporter: 'json'
          }
        })
      })

      describe('and we compile a basic file', function () {
        describe('and we don\'t specify an output directory', function () {
          let reportFile

          it('then it should output the raw report to "./complexity"', async function () {
            const stats = await compile(['./basic.js'], config)
            const outputDir = path.join(process.cwd(), 'complexity')
            expect(stats).to.exist

            // There should be a single report in the folder
            const files = await fs.readdir(outputDir)
            expect(files.length).to.equal(1)

            reportFile = path.join(outputDir, files[0])
            const report = require(reportFile)
            expect(report).to.exist

            // There should be one report in the file (basic)
            expect(report.modules.length).to.equal(1)

            // Check the first module in the report ('basic.js')
            const basicReport = report.modules[0]
            expect(basicReport).to.exist
            expect(basicReport.methods.length).to.equal(2)

            checkRaw(basicReport, reportExpectations.basic)
          })

          afterEach(async function () {
            // Clean up the generated report
            await fs.unlink(reportFile)
          })
        })

        describe('and we specify an output directory', function () {
          describe('and value specified isn\'t a string', function () {
            it('the compilation result should contain an error about the invalid outputDir', async function () {
              const badValues = [{}, null, [], () => {}, true, NaN, /regex/, 0, Infinity]

              await Promise.all(
                badValues.map(async (badValue) => {
                  const stats = await compile(
                    ['./basic.js'],
                    mergeWith({}, config, {
                      complexity: {
                        outputDir: badValue
                      }
                    })
                  )

                  expect(stats.hasErrors()).to.equal(true)
                  expect(stats.compilation.errors[0].toString()).to.have.string('options.outputDir invalid')
                })
              )
            })
          })

          describe('and value specified is a string', function () {
            let outputDir

            beforeEach(async function () {
              outputDir = await temp.mkdir('complexity-loader-test')
              config = mergeWith({}, config, {
                complexity: {
                  outputDir
                }
              })
            })

            it('then it should output the raw report as JSON to the specified folder', async function () {
              const stats = await compile(['./basic.js'], config)
              expect(stats).to.exist

              // There should be a single report in the folder
              const files = await fs.readdir(outputDir)
              expect(files.length).to.equal(1)

              const report = require(path.join(outputDir, files[0]))
              expect(report).to.exist

              // There should be one report in the file (basic)
              expect(report.modules.length).to.equal(1)

              // Check the first module in the report ('basic.js')
              const basicReport = report.modules[0]
              expect(basicReport).to.exist
              expect(basicReport.methods.length).to.equal(2)

              checkRaw(basicReport, reportExpectations.basic)
            })

            describe('and we specify an output filename', function () {
              describe('and value specified isn\'t a string', function () {
                it('the compilation result should contain an error about the invalid reportFilename', async function () {
                  const badValues = [{}, null, [], () => {}, true, NaN, /regex/, 0, Infinity]

                  await Promise.all(
                    badValues.map(async (badValue) => {
                      const stats = await compile(
                        ['./basic.js'],
                        mergeWith({}, config, {
                          complexity: {
                            reportFilename: {}
                          }
                        })
                      )

                      expect(stats.hasErrors()).to.equal(true)
                      expect(stats.compilation.errors[0].toString()).to.have.string('options.reportFilename invalid')
                    })
                  )
                })
              })

              describe('and value specified is a string', function () {
                let reportFilename

                beforeEach(async function () {
                  reportFilename = 'my-complexity-report'
                  config = mergeWith({}, config, {
                    complexity: {
                      reportFilename
                    }
                  })
                })

                it('then it should output the raw report as JSON using the specified filename', async function () {
                  const stats = await compile(['./basic.js'], config)
                  expect(stats).to.exist

                  const report = require(path.join(outputDir, reportFilename))
                  expect(report).to.exist

                  // There should be one report in the file (basic)
                  expect(report.modules.length).to.equal(1)

                  // Check the first module in the report ('basic.js')
                  const basicReport = report.modules[0]
                  expect(basicReport).to.exist
                  expect(basicReport.methods.length).to.equal(2)

                  checkRaw(basicReport, reportExpectations.basic)
                })
              })
            })
          })
        })
      })
    })

    describe('and we use the "console" reporter', function () {
      let stdoutText
      let unhook

      function hookStdOut (collector, suppress) {
        const stdoutWrite = process.stdout.write

        // Replace write with an intercept function
        process.stdout.write = (buffer, encoding, fileDescriptor) => {
          // This pushes the strings being written to our collector array (split on newlines)
          collector.push(...buffer.toString(encoding).split(/\r?\n/))

          // And then calls the original write method (if not suppressed)
          return suppress ? null : stdoutWrite.call(process.stdout, buffer, encoding, fileDescriptor)
        }

        // Return a 'restore' function
        return () => { process.stdout.write = stdoutWrite }
      }

      function getTableData (tableBody) {
        const tableRows = tableBody.split('┤')
          .map(rawRow => {
            const dataRow = rawRow.split('\n')[1]
            const cells = dataRow.split('│')
              // Remove the (empty) first and last cells
              .filter((row, i, arr) => !!i && i < arr.length - 1)
              // Remove the colour codes and extra whitespace added to each cell by cli-table
              .map(cellValue => stripcolorcodes(cellValue).trim())

            return cells
          })

        // Convert rows into a series of objects with the column headers as keys
        const headerRow = tableRows[0]
        return tableRows
          // Remove the header row itself
          .filter((row, i) => !!i)
          .map(row =>
            row.reduce((rowObj, cell, i) => {
              rowObj[headerRow[i]] = cell
              return rowObj
            }, {})
          )
      }

      function getTable (lines, title) {
        // TODO: Find the table and extract its data
        const joinedLines = lines.join('\n')
        const titleIndex = joinedLines.indexOf(title)
        const afterTitle = titleIndex < 0 ? '' : joinedLines.slice(titleIndex + title.length)

        const tableBody = afterTitle.match(/┌(?:\s|[^┘])*/)

        return getTableData(tableBody ? tableBody[0] : '')
      }

      beforeEach(function () {
        config = mergeWith({}, config, {
          complexity: {
            reporter: 'console'
          }
        })

        stdoutText = []
      })

      afterEach(function () {
        // Make sure we unhook, even if a test crashes
        unhook()
      })

      describe('and we compile a basic file', function () {
        // TODO: File level report and raw/method-level report (also new 'method' level for memory reporter...)

        describe('and we use the default "project" report level', function () {
          beforeEach(function () {
            config = mergeWith({}, config, {
              complexity: {
                level: 'project'
              }
            })
          })

          it('then it should emit a a single table with with one row of project average stats', async function () {
            unhook = hookStdOut(stdoutText, true)

            const stats = await compile(
              ['./basic.babel.js'],
              mergeWith({}, config)
            )
            unhook()

            expect(stats).to.exist

            const basicTable = getTable(stdoutText, 'Complexity report')
            expect(basicTable).to.exist

            // TODO: Add some real assertions about the results here...
          })
        })
      })
    })
  })
})
