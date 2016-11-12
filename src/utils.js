// If the object passed in isn't an array, then wrap it in one
export function arrayise (maybeArray) {
  if (Array.isArray(maybeArray)) {
    return maybeArray
  }
  return [maybeArray]
}

export function arrayContains (array, value) {
  return array.indexOf(value) >= 0
}

// Guards against multiple invocations happening for the same 'target'
// The returned function should be called with the target as the first argument, if this target
// hasn't already caused 'invoke' to run, then 'invoke' will be called with the target and all
// other args that were passed to the function.
export function invokeOnce (invoke) {
  const invoked = new WeakMap()

  return function (target, ...args) {
    if (invoked.get(target)) {
      return
    }

    const result = invoke(target, ...args)
    invoked.set(target, true)

    return result
  }
}

// TODO: Pull this out into a package..?
function getResolver (resolve, reject) {
  return function (err, result) {
    if (err) {
      return reject(err)
    }

    return resolve(result)
  }
}

export function promisify (func, thisArg) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      // Call func with all args passed in, replacing the arg where promisify is passed in with
      // the 'node-style' resolver callback
      func.call(
        thisArg || this,
        ...(args.map(arg => arg !== promisify ? arg : getResolver(resolve, reject)))
      )
    })
  }
}

// Alias for readability
promisify.done = promisify
