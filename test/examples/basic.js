export function basic (a, b) {
  if (a > b) {
    while (a !== b) {
      a = b
    }
  }
  console.log(a + b)
}

export function basic2 (a, b) {
  if (a >= b) {
    if (a === b) {
      a = b - 1
    }

    while (a !== b) {
      a = b
    }
  }
  console.log(a + b)
}
