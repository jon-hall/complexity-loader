'use strict'

const Complex2 = require('./complex2.js')

module.exports = class Complex extends Complex2 {
  complex (a, b, c, d) {
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

  complex2 (a, b, c, d) {
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
