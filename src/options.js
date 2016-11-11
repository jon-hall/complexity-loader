import loaderUtils from 'loader-utils'
import merge from 'lodash.merge'

import { arrayContains } from './utils.js'

import * as processors from './processors/index.js'

const VALID_LEVELS = Object.keys(processors).filter(key => key !== 'default')

const defaultOptions = {
  // Can be a single value, or an array of values - currently the 'console' reporter is yet to be
  // written, and we only support supplying a function (a "memory reporter") - eventually html etc.
  // will be valid values (with further config as needed)...
  reporter: 'console',
  level: 'raw'
  // TODO: Threshold config etc.
}

export function parse (options, query) {
  const packOptions = options && options.complexity ? options.complexity : {}
  const loaderOptions = loaderUtils.parseQuery(query)
  const mergedOptions = merge({}, defaultOptions, packOptions, loaderOptions)

  validateOptions(mergedOptions)

  return mergedOptions
}

function validateOptions (options) {
  if (!arrayContains(VALID_LEVELS, options.level)) {
    throw new TypeError(`options.level invalid, please specify one of: ${VALID_LEVELS.join(', ')}`)
  }

  // TODO: Validate reporters as either functions or known reporters
}
