export async function complex (a, b, c, d) {
  if (a > b) {
    while (a !== b) {
      a = b - 1
      while (a !== b) {
        a = b
      }
      if (a === d) {
        break
      } else {
        a = d
        while (c < d) {
          c++
          if (a !== c) {
            a = c
          }
        }
      }
    }
  }
  console.log(a + b)
}

export function complex2 (a, b, c, d) {
  if (a > b) {
    while (a !== b) {
      a = b - 1
      while (a !== b) {
        a = b
      }
      if (a === d) {
        break
      } else {
        a = d
        while (c < d) {
          c++
          if (a !== c) {
            a = c
          }
        }
      }
    }
  }
  console.log(a + b)
}
