import baseConfig from './webpack.config.base.babel.js'

export default baseConfig({
    babel: {
        plugins: ['istanbul']
    }
})
