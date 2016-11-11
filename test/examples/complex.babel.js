'use strict'

import Complex2 from './complex2.babel.js'

export default class Complex extends Complex2 {
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
