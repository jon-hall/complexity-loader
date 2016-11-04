import loaderUtils from 'loader-utils'
import merge from 'lodash.merge'

const defaultOptions = {
  // Can be a single value, or an array of values - currently the 'console' reporter is yet to be
  // written, and we only support supplying a function (a "memory reporter") - eventually html etc.
  // will be valid values (with further config as needed)...
  reporter: 'console'

  // TODO: Threshold config etc.
}

export function parse (options, query) {
  const packOptions = options && options.complexity ? options.complexity : {}
  const loaderOptions = loaderUtils.parseQuery(query)
  return merge({}, defaultOptions, packOptions, loaderOptions)
}
