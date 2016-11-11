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

const registerDoneListener = invokeOnce((compiler, onDone) => compiler.plugin('done', onDone))

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

    registerDoneListener(this._compiler, async () => {
      await generateAndEmitReport(reporters, allFiles, options)

      // Empty our files aggregator
      allFiles.splice(0, allFiles.length)
    })

    addFile(path.relative(process.cwd(), this.resourcePath), this.resourcePath, content)
    return callback(null, content, sourceMap)
  } catch (ex) {
    callback(ex)
  }
}
