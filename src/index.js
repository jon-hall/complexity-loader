import loaderUtils from 'loader-utils'
import merge from 'lodash.merge'
import escomplex from 'typhonjs-escomplex'

const defaultOptions = {
  // Can be a single value, or an array of values - currently the 'console' reporter is yet to be
  // written, and we only support supplying a function (a "memory reporter") - eventually html etc.
  // will be valid values (with further config as needed)...
  reporter: 'console'

  // TODO: Threshold config etc.
}

function arrayise (maybeArray) {
  if (Array.isArray(maybeArray)) {
    return maybeArray
  }
  return [maybeArray]
}

const allReports = []
function addReport (report) {
  allReports.push(report)
}

let registered
function registerDoneListener (compiler, onDone) {
  if (registered === compiler) {
    return
  }

  compiler.plugin('done', onDone)
  registered = compiler
}

async function emitReport (reporters, reports) {
  return await Promise.all(reporters.map(async reporter => {
    if (typeof reporter === 'function') {
      await reporter(reports)
    }

    // TODO: Console reporter, JSON reporter etc.
  }))
}

export default function (content) {
  const callback = this.async()
  const packOptions = this.options.complexity || {}
  const loaderOptions = loaderUtils.parseQuery(this.query)
  const options = merge({}, defaultOptions, packOptions, loaderOptions)
  const reporters = arrayise(options.reporter)

  this.cacheable()

  registerDoneListener(this._compiler, async () => {
    await emitReport(reporters, allReports)

    // Empty our reports aggregator
    allReports.splice(0, allReports.length)
  })

  const report = escomplex.analyzeModule(content)

  addReport(report)

  return callback(null, content)
}
