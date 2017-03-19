const path = require('path')
// 将对vue文件的webpack配置分离出来
const vueConfig = require('./vue-loader.config')

module.exports = {
	devtool: '#source-map',
	entry: {
		app: './src/client-entry.js',
		// 将第三方库抽离bundle文件
		vendor: [
			'es6-promise',
			'firebase/app',
			'firebase/database',
			'vue',
			'vue-router',
			'vuex',
			'vuex-router-sync'
		]
	},
	output: {
		path: path.resolve(__dirname, '../dist'),
		publicPath: '/dist/',
		filename: '[name].[chunkhash].js'
	},
	resolve: {
		// 配置模块默认路径，可以减少webpack搜索模块的时间
		alias: {
			'public': path.resolve(__dirname, '../public')
		}
	},
	module: {
		// 防止webpack解析那些任何与给定正则表达式相匹配的文件
		// 忽略大型库文件可以提高构建性能
		// 参数为正则表达式
		noParse: /es6-promise\.js$/, 
		rules: [
			{
				test: /\.vue$/,
				loader: 'vue-loader',
				// options属性为字符串或对象，值可以传递到loader中
				options: vueConfig
			},
			{
				test: /\.js$/,
				loader: 'buble-loader',
				exclude: /node_modules/,
				options: {
					objectAssign: 'Object.assign'
				}
			},
			{
				test: /\.(png|jpg|gif|svg)$/,
				loader: 'url-loader',
				options: {
					limit: 10000,
					name: '[name].[ext]?[hash]'
				}
			}
		]
	},
	// 配置如何展示性能提示
	performance: {
		// 打开或者关闭警告提示，默认为warning
		hints: process.env.NODE_ENV === 'production' ? 'warning' : false
	}
}
