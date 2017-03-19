const fs = require('fs')
const path = require('path')
const express = require('express')
const favicon = require('serve-favicon')
// 压缩代码
const compression = require('compression')
// 序列化
const serialize = require('serialize-javascript')
// 获取绝对路径
const resolve = file => path.resolve(__dirname, file)
//判断当前的开发环境
// process.env.NODE_ENV的值一般是在package.json的scripts属性中设置的
// cross-env可以跨平台设置NODE_ENV
const isProd = process.env.NODE_ENV === 'production'

const app = express()

let indexHTML
let renderer  
if (isProd) {
	// 若处于生产环境则直接将webpack打包好的server-bundle文件用作服务端渲染
	renderer = createRenderer(fs.readFileSync(resolve('./dist/server-bundle.js'), 'utf-8'))
	indexHTML = parseIndex(fs.readFileSync(resolve('./dist/index.html'), 'utf-8'))
} else {
	// 若处于开发环境，则开启带有监听和热启动设置的服务器
	require('./build/setup-dev-server')(app, {
		bundleUpdated: bundle => {
			renderer = createRenderer(bundle)
		},
		indexUpdated: index => {
			indexHTML = parseIndex(index)
		}
	})
}

// 进行服务端渲染
function createRenderer (bundle) {
	// bundle为webpack打包好的文件
	return require('vue-server-renderer').createBundleRenderer(bundle, {
		// 进行缓存
		cache: require('lru-cache')({
			max: 1000,
			maxAge: 1000 * 60 * 15
		})
	})
}

// 将template分成head和tail两部分，以便使用bundleRenderer.rendererToStream进行流式输出
function parseIndex (template) {
	const contentMarker = '<!-- APP -->'
	const i = template.indexOf(contentMarker)
	return {
		head: template.slice(0, i),
		tail: template.slice(i + contentMarker.length)
	}
}

// 在Cache-Control头部中设置max-age属性
const serve = (path, cache) => express.static(resolve(path), {
	maxAge: cache && isProd ? 60 * 60 * 24 * 30 : 0
})

app.use(compression({ threshold: 0 }))
app.use(favicon('./public/logo-48.png'))
app.use('/service-worker.js', serve('./dist/service-worker.js'))
app.use('/manifest.json', serve('./manifest.json'))
app.use('/dist', serve('./dist'))
app.use('/public', serve('./public'))

app.get('*', (req, res) => {
	if (!renderer) {
		return res.end('waiting for compilation... refresh in a moment.')
	}

	res.setHeader("Content-Type", "text/html")

	var s = Date.now()
	// 当前上下文环境
	const context = { url: req.url }
	const renderStream = renderer.renderToStream(context)

	// 将head部分写入相应
	renderStream.once('data', () => {
		res.write(indexHTML.head)
	})

	// 每当有新的chunk被渲染完成都将写入响应
	renderStream.on('data', chunk => {
		res.write(chunk)
	})


	renderStream.on('end', () => {
		if (context.initialState) {
			// 嵌入初始的store state
			res.write(
				`<script>window.__INITIAL_STATE__=${
					serialize(context.initialState, { isJSON: true })
				}</script>`
				)
		}
		// 将tail部分写入响应
		res.end(indexHTML.tail)
		console.log(`whole request: ${Date.now() - s}ms`)
	})

	// 错误处理
	renderStream.on('error', err => {
		if (err && err.code === '404') {
			res.status(404).end('404 | Page Not Found')
			return
		}
		res.status(500).end('Internal Error 500')
		console.error(`error during render : ${req.url}`)
		console.error(err)
	})
})

const port = process.env.PORT || 8080
app.listen(port, () => {
	console.log(`server started at localhost:${port}`)
})
