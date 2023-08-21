import Fs from 'node:fs/promises';
import Path from 'node:path';

import autoprefixer from 'autoprefixer';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import Webpack from 'webpack';

export default function (envArg, argv) {
	const {
		WEBPACK_SERVE,
		cframePath = './cframes/cframe-1', // TODO: Customize
		env = 'dev', // 'dev', 'qa', 'prod'
		html_file_name: htmlFileName = 'index.html', // TODO: Customize
		html_title: htmlTitle = 'Webpack Experiments', // TODO: Customize
		public_path: publicPath, // TODO: Customize
		served = WEBPACK_SERVE || false
	} = envArg;
	const {
		mode = env === 'dev' ? 'development' : 'production', // 'development', 'production'
	} = argv;

	const isProd = mode === 'production';

	return Fs.readFile('./src/app.ejs', { encoding: 'utf-8' }).then((content) => {
		const headMatch = content.match(/<!-- HEAD -->(.*?)<!-- HEAD END -->/s);
		const head = headMatch ? headMatch[1] : '';
		const bodyMatch = content.match(/<!-- BODY -->(.*?)<!-- BODY END -->/s);
		const body = bodyMatch ? bodyMatch[1] : '';
		const footerMatch = content.match(/<!-- FOOTER -->(.*?)<!-- FOOTER END -->/s);
		const footer = footerMatch ? footerMatch[1] : '';

		return import(Path.resolve(Path.join(cframePath, 'webpack-helper.mjs'))).then(({
			alias: cframeAlias,
			prepareTemplate: prepareCframeTemplate,
			providePlugins: cframeProvidePlugins
		}) => {
			return prepareCframeTemplate(Path.resolve('./tmp'), { head, body, footer }).then((cframeTemplatePath) => {
				return { cframeAlias, cframeProvidePlugins, cframeTemplatePath };
			});
		});
	}).then(({ cframeAlias, cframeProvidePlugins, cframeTemplatePath }) => {
		return {
			entry: './src/main.tsx',
			output: {
				path: publicPath
					? Path.resolve('./dist', publicPath)
					: Path.resolve('./dist'),
				filename: 'main.[hash].js',
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
							'style-loader',
							'css-loader'
						],
					},
					{
						test: /\.jsx?$/,
						use: 'babel-loader',
						exclude: /node_modules/
					},
					{
						test: /\.png$/i,
						type: 'asset/resource'
					},
					{
						test: /\.s[ac]ss$/i,
						use: [
							'style-loader',
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
			plugins: [
				new HtmlWebpackPlugin({
					title: htmlTitle,
					filename: htmlFileName,
					template: cframeTemplatePath,
					inject: false
				}),
				new Webpack.ProvidePlugin({
					...cframeProvidePlugins
				})
			],
			mode,
			resolve: {
				alias: {
					cframe: Path.resolve(cframePath, cframeAlias) // TODO: Customize
				},
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
		};
	});
}
