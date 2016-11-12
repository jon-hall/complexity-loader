import path from 'path'

import escomplex from 'typhonjs-escomplex'

import { arrayise, invokeOnce } from './utils.js'
import { parse as parseOptions } from './options.js'
import * as processors from './processors/index.js'
import * as builtinReporters from './reporters/index.js'

const allFiles = []
function addFile (srcPath, filePath, code) {
  allFiles.push({
    srcPath,
    filePath,
    code
  })
}

const registerDoneListener = invokeOnce((compiler, onDone) => compiler.plugin('after-compile', onDone))

async function generateAndEmitReport (reporters, files, options) {
  const reports = escomplex.analyzeProject(files)
  const processedReport = processors[options.level](reports)

  return await Promise.all(reporters.map(async reporter => {
    if (typeof reporter === 'function') {
      // TODO: Test receiving options in 'memory' reporter
      return await reporter(processedReport, options)
    }

    return await builtinReporters[reporter.toLowerCase()](processedReport, options)
  }))
}

export default async function (content, sourceMap) {
  const callback = this.async()

  try {
    const options = parseOptions(this.options, this.query)
    const reporters = arrayise(options.reporter)

    this.cacheable()

    registerDoneListener(this._compiler, async (compilation, done) => {
      let err

      try {
        await generateAndEmitReport(reporters, allFiles, options)

        // Empty our files aggregator
        allFiles.splice(0, allFiles.length)
      } catch (ex) {
        // Catch any exceptions to pass back to webpack in the 'done' callback
        err = ex
      }

      // Since we hook the (async) event/plugin 'after-compile', we need to invoke the 'done'
      // callback once our reports are generated, to let webpack finish up compilation
      done(err)
    })

    addFile(path.relative(process.cwd(), this.resourcePath), this.resourcePath, content)
    return callback(null, content, sourceMap)
  } catch (ex) {
    callback(ex)
  }
}
