module.exports = {
	// 是否保留空格
	preserveWhitespace: false,
	postcss: [
		require('autoprefixer')({
			browsers: ['last 3 versions']
		})
	]
}
