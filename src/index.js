import escomplex from 'typhonjs-escomplex'

import { arrayise, invokeOnce } from './utils.js'
import { parse as parseOptions } from './options.js'
import processors from './processors/index.js'

const allFiles = []
function addFile (srcPath, code) {
  allFiles.push({
    srcPath,
    // TODO: Work out the absolute filepath
    code
  })
}

const registerDoneListener = invokeOnce((compiler, onDone) => compiler.plugin('done', onDone))

async function generateAndEmitReport (reporters, files, options) {
  const reports = escomplex.analyzeProject(files)
  const processedReport = processors[options.level](reports)

  return await Promise.all(reporters.map(async reporter => {
    if (typeof reporter === 'function') {
      await reporter(processedReport)
    }

    // TODO: Console reporter, JSON reporter etc.
  }))
}

export default function (content) {
  const callback = this.async()
  const options = parseOptions(this.options, this.query)
  const reporters = arrayise(options.reporter)

  this.cacheable()

  registerDoneListener(this._compiler, async () => {
    await generateAndEmitReport(reporters, allFiles, options)

    // Empty our files aggregator
    allFiles.splice(0, allFiles.length)
  })

  addFile(this.resourcePath, content)

  return callback(null, content)
}
