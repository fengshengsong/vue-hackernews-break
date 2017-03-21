const webpack = require('webpack')
const base = require('./webpack.base.config')
const vueConfig = require('./vue-loader.config')
const HTMLPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
// service worker预缓存
const SWPrecachePlugin = require('sw-precache-webpack-plugin')

const config = Object.assign({}, base, {
	resolve: {
		alias: Object.assign({}, base.resolve.alias, {
			// 'create-api': './create-api-client.js'
		})
	},
	plugins: (base.plugins || []).concat([
		// 设置为全局变量
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
			'process.env.VUE_ENV': '"client"'
		}),
		new webpack.optimize.CommonsChunkPlugin({
			name: 'vendor'
		}),
		new HTMLPlugin({
			template: 'src/index.template.html'
		})
	])
})

if (process.env.NODE_ENV === 'production') {
	vueConfig.loaders = {
		stylus: ExtractTextPlugin.extract({
			loader: 'css-loader!stylus-loader',
	  		fallbackLoader: 'vue-style-loader'
		})
	}
	config.plugins.push(
		new ExtractTextPlugin('styles.[hash].css'),
		// http://www.css88.com/doc/webpack2/plugins/loader-options-plugin
		// 未来可能会被移除
		new webpack.LoaderOptionsPlugin({
			minimize: true
		}),
		new webpack.optimize.UglifyJsPlugin({
			compress: {
				warnings: false
			}
		}),
		// 缓存生产环境下额外的项目依赖
		new SWPrecachePlugin({
			cacheId: 'vue-hn',
			filename: 'service-worker.js',
			dontCacheBustUrlsMatching: /./,
			staticFileGlobsIgnorePatterns: [/index\.html$/, /\.map$/]
		})
	)
}

module.exports = config
