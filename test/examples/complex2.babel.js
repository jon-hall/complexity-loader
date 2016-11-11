export default class Complex2 {
  async baseComplex (a = 5, b = 0, c, d) {
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
