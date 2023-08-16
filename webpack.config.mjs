import Fs from 'node:fs/promises';
import Path from 'node:path';

import autoprefixer from 'autoprefixer';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import Webpack from 'webpack';

const CFRAME_PATH = './cframes/cframe-1';
const APP_PATH = 'webapps/app_name'; // 'resources/app_name';
const HTML_FILENAME = 'index.html'; // 'html/app.html';

export default function (envArg, argv) {
	console.log(envArg, argv);

	const {
		WEBPACK_SERVE,
		NOT_LOCAL = WEBPACK_SERVE,
		env = 'dev' // 'dev', 'qa', 'prod'
	} = envArg;
	const {
		mode = envArg === 'dev' ? 'development' : 'production'
	} = argv;

	const isLocal = !NOT_LOCAL;

	return import(Path.resolve(Path.join(CFRAME_PATH, 'webpack-helper.mjs'))).then(({ default: makeTemplate }) => {
		return Fs.readFile('./src/app.ejs', { encoding: 'utf-8' }).then((content) => {
			const headMatch = content.match(/<!-- HEAD -->(.*?)<!-- HEAD END -->/s);
			const head = headMatch ? headMatch[1] : '';

			const bodyMatch = content.match(/<!-- BODY -->(.*?)<!-- BODY END -->/s);
			const body = bodyMatch ? bodyMatch[1] : '';

			const footerMatch = content.match(/<!-- FOOTER -->(.*?)<!-- FOOTER END -->/s);
			const footer = footerMatch ? footerMatch[1] : '';

			return makeTemplate(head, body, footer, Path.resolve('./tmp'));
		}).then(({
			aliasPath: cframeAliasPath,
			templatePath: cframeTemplatePath,
			providePlugin: cframeProvidePlugin = {}
		}) => {
			return {
				entry: './src/main.tsx',
				output: {
					path: Path.resolve(Path.join('./dist', APP_PATH)),
					filename: 'main.[hash].js',
					publicPath: Path.join(isLocal ? '/dist' : '/', APP_PATH)
					// publicPath: Path.join('/', APP_PATH)
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
						title: 'Webpack Experiments',
						filename: HTML_FILENAME,
						template: cframeTemplatePath,
						inject: false
					}),
					new Webpack.ProvidePlugin({
						...cframeProvidePlugin
					})
				],
				mode,
				resolve: {
					alias: {
						cframe: cframeAliasPath
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
					port: 9000
				}
			};
		});
	});
}
