# complexity-loader

Complexity analysis, provided by [typhonjs-escomplex], for code loaded using [webpack].

[typhonjs-escomplex]: https://github.com/typhonjs-node-escomplex/typhonjs-escomplex
[webpack]: http://webpack.github.io/

## Install

```sh
npm install complexity-loader --save-dev
```

## Usage
Just add the loader to your `webpack.config.js` like this:
```js
module.exports = {
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['complexity-loader']
      }
    ]
  }
}
```

##### Usage with Babel
```js
module.exports = {
  module: {
    loaders: [
      {
        test: /\.js$/,
        // Run your ES6+ code through complexity-loader before
        // babel (and other transforms)
        loaders: ['babel-loader', 'complexity-loader']
      }
    ]
  }
}
```
