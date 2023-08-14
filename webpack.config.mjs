import Fs from 'node:fs/promises';
import Path from 'node:path';

import autoprefixer from 'autoprefixer';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import Webpack from 'webpack';

export default function (env, argv) {
	console.log(env, argv);

	const {
		cframe = './src/cframe-1',
		mode = 'development'
	} = argv;

	return Fs.readFile('./src/app.ejs', { encoding: 'utf-8' }).then((content) => {
		const headMatch = content.match(/<!-- HEAD -->(.*?)<!-- HEAD END -->/s);
		const bodyMatch = content.match(/<!-- BODY -->(.*?)<!-- BODY END -->/s);
		const footerMatch = content.match(/<!-- FOOTER -->(.*?)<!-- FOOTER END -->/s);

		const cframePath = Path.join(cframe, 'cframe.ejs');
		return Fs.readFile(cframePath, { encoding: 'utf-8' }).then((content) => {
			content = content
				.replace('<!-- HEAD -->', headMatch ? headMatch[1] : '')
				.replace('<!-- BODY -->', bodyMatch ? bodyMatch[1] : '')
				.replace('<!-- FOOTER -->', footerMatch ? footerMatch[1] : '')

			return Fs.mkdir('./tmp/assets', { recursive: true }).then(() => {
				return Promise.all([
					Fs.readdir(Path.join(cframe, 'assets')).then((files) => {
						const promises = [];
						const length = files.length;
						for (let index = 0; index < length; index++) {
							const file = files[index];
							const srcFilePath = Path.join(cframe, 'assets', file);
							promises.push(Fs.lstat(srcFilePath).then((lstat) => {
								if (lstat.isDirectory()) return;
								const destFilePath = Path.join('./tmp/assets', file);
								return Fs.copyFile(srcFilePath, destFilePath);
							}));
						}
						return Promise.all(promises);
					}, (error) => {
						console.error(error);
					}),
					Fs.writeFile('./tmp/page.ejs', content, { encoding: 'utf-8' })
				]);
			});
		});
	}).then(() => {
		return {
			entry: './src/main.tsx',
			output: {
				path: Path.resolve('./dist'),
				filename: 'main.[hash].js',
				publicPath: '/dist'
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
					filename: 'index.html',
					template: './tmp/page.ejs',
					inject: false
				}),
				new Webpack.ProvidePlugin({
					$: 'jquery',
					jQuery: 'jquery'
				})
			],
			mode,
			resolve: {
				alias: {
					cframe: Path.resolve('./src/cframe-1')
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
			]
		};
	});
}
