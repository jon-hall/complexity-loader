import assert from 'assert'

export default class Complex {
  async complex (a, b, c, d) {
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
    assert(a < b)
    console.log(a + b)
  }

  async complex2 (a, b, c, d) {
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
}
