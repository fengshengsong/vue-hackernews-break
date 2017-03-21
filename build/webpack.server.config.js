const webpack = require('webpack')
const base = require('./webpack.base.config')

module.exports = Object.assign({}, base, {
	// webpack能够为多种环境或target构建编译
	// 配置target可以告诉webpack这个程序的目标环境是什么，默认值为web
	// 服务器端渲染环境应该设置为node
	target: 'node',
	devtool: false,
	entry: './src/server-entry.js',
	output: Object.assign({}, base.output, {
		filename: 'server-bundle.js',
		libraryTarget: 'commonjs2'
	}),
	resolve: {
		alias: Object.assign({}, base.resolve.alias, {
			'create-api': './create-api-server.js'
		})
	},
	// 不打包进bundle文件
	// https://github.com/zhengweikeng/blog/issues/10
	externals: Object.keys(require('../package.json').dependencies),
	plugins: [
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
			'process.env.VUE_ENV': '"server"'
		})
	]
})
