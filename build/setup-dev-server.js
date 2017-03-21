const path = require('path')
const webpack = require('webpack')
const MFS = require('memory-fs')
const clientConfig = require('./webpack.client.config')
const serverConfig = require('./webpack.server.config')

module.exports = function setupDevServer (app, opts) {
	clientConfig.entry.app = ['webpack-hot-middleware/client', clientConfig.entry.app]
	clientConfig.output.filename = '[name].js'
	clientConfig.plugins.push(
		new webpack.HotModuleReplacementPlugin(),
		new webpack.NoEmitOnErrorsPlugin()
	)
	const clientCompiler = webpack(clientConfig)
	// 热重载中会使用memory-fs模块将文件存放在内存中
	const devMiddleware = require('webpack-dev-middleware')(clientCompiler, {
		publicPath: clientConfig.output.publicPath,
		stats: {
			colors: true,
			chunks: false
		}
	})
	app.use(devMiddleware)
	clientCompiler.plugin('done', () => {
		const fs = devMiddleware.fileSystem
		const filePath = path.join(clientConfig.output.path, 'index.html')
		if (fs.existsSync(filePath)) {
			const index = fs.readFileSync(filePath, 'utf-8')
			opts.indexUpdated(index)
		}
	})
	app.use(require('webpack-hot-middleware')(clientCompiler))
	const serverCompiler = webpack(serverConfig)
	const mfs = new MFS()
	const outputPath = path.join(serverConfig.output.path, serverConfig.output.filename)
	serverCompiler.outputFileSystem = mfs
	serverCompiler.watch({}, (err, stats) => {
		if (err) throw err
			stats = stats.toJson()
		stats.errors.forEach(err => console.error(err))
		stats.warnings.forEach(err => console.warn(err))
		opts.bundleUpdated(mfs.readFileSync(outputPath, 'utf-8'))
	})
}
