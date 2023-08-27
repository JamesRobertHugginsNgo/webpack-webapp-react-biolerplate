import Path from 'node:path';

import autoprefixer from 'autoprefixer';
import CssMinimizerWebpackPlugin from 'css-minimizer-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import WebpackMerge from 'webpack-merge';

function merge(env, argv, ...webpackConfigs) {
	function mergeFunction(func) {
		return mergeValue(func(env, argv));
	}
	function mergePromise(promise) {
		return promise.then(mergeValue);
	}
	function mergeValue(value) {
		if (value) {
			if (typeof value === 'function') return mergeFunction(value);
			if (value instanceof Promise) return mergePromise(value);
			if (typeof value === 'object' && value.default) return mergeValue(value.default);
			if (typeof value === 'string') return mergeValue(import(value));
		}
		return value;
	}

	if (Array.isArray(webpackConfigs[0])) {
		webpackConfigs = webpackConfigs[0];
	}
	const length = webpackConfigs.length;
	for (let index = 0; index < length; index++) {
		webpackConfigs[index] = mergeValue(webpackConfigs[index]);
	}
	return webpackConfigs.every((webpackConfig) => !(webpackConfig instanceof Promise))
		? WebpackMerge.merge(...webpackConfigs)
		: Promise.all(webpackConfigs)
			.then((...webpackConfigs) => WebpackMerge.merge(...webpackConfigs));
}

export default function (envArg, argv) {
	const {
		cframe_path: cframePath,
		env,
		public_path: publicPath,
		served
	} = (({
		WEBPACK_SERVE,
		cframe_content_path = './src/app.ejs',
		cframe_path = './cframes/cframe-1', // TODO: Customize default value
		env = 'dev', // 'dev', 'qa', 'prod'
		html_file_name = 'index.html', // TODO: Customize default value
		html_title = 'Webpack Experiments', // TODO: Customize default value
		public_path = null, // TODO: Customize default value
		served = WEBPACK_SERVE || false
	}) => Object.assign(envArg, {
		cframe_content_path,
		cframe_path,
		env,
		html_file_name,
		html_title,
		public_path,
		served
	}))(envArg);

	const { mode } = (({
		mode = env === 'dev' ? 'development' : 'production'
	}) => Object.assign(argv, { mode }))(argv);

	const isProd = mode === 'production';

	return merge(envArg, argv, Path.resolve(Path.join(cframePath, 'webpack.config.mjs')), {
		entry: './src/main.tsx',
		output: {
			path: publicPath
				? Path.resolve('./dist', publicPath)
				: Path.resolve('./dist'),
			filename: 'main.[fullhash].js',
			publicPath: publicPath
				? served
					? publicPath
					: Path.join('/dist/', publicPath)
				: 'auto'
		},
		module: {
			rules: [
				{
					test: /\.css$/i,
					use: [
						isProd ? MiniCssExtractPlugin.loader : 'style-loader',
						'css-loader'
					],
				},
				{
					test: /\.jsx?$/,
					use: 'babel-loader',
					exclude: /node_modules/
				},
				{
					test: /\.(gif|jpeg|jpg|png)$/i,
					type: 'asset/resource'
				},
				{
					test: /\.s[ac]ss$/i,
					use: [
						isProd ? MiniCssExtractPlugin.loader : 'style-loader',
						'css-loader',
						{
							loader: 'postcss-loader',
							options: {
								postcssOptions: {
									plugins: [
										autoprefixer
									]
								}
							}
						},
						'sass-loader',
					],
				},
				{
					test: /\.svg$/i,
					type: 'asset/source'
				},
				{
					test: /\.tsx?$/i,
					use: [
						'babel-loader',
						'ts-loader'
					],
					exclude: /node_modules/,
				}
			]
		},
		optimization: {
			minimizer: [
				new CssMinimizerWebpackPlugin()
			]
		},
		plugins: [
			isProd ? new MiniCssExtractPlugin({
				filename: 'main[fullhash].css',
			}) : false
		].filter(Boolean),
		mode,
		resolve: {
			extensions: [
				'.ts',
				'.tsx',
				'.js',
				'.jsx'
			]
		},
		target: [
			'web',
			'es5'
		],
		devServer: {
			open: true,
			port: 9000
		}
	});
}
