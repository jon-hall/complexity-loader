// If the object passed in isn't an array, then wrap it in one
export function arrayise (maybeArray) {
  if (Array.isArray(maybeArray)) {
    return maybeArray
  }
  return [maybeArray]
}

// Guards against multiple invocations happening for the same 'target'
// The returned function should be called with the target as the first argument, if this target
// hasn't already caused 'invoke' to run, then 'invoke' will be called with the target and all
// other args that were passed to the function.
export function invokeOnce (invoke) {
  const invoked = new WeakMap()

  return function registrator (target, ...args) {
    if (invoked.get(target)) {
      return
    }

    const result = invoke(target, ...args)
    invoked.set(target, true)

    return result
  }
}
