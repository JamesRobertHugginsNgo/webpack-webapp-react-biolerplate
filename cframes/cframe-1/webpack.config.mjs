import Fs from 'node:fs/promises';
import Path from 'node:path';

import HtmlWebpackPlugin from 'html-webpack-plugin';
import Webpack from 'webpack';

export default function (env) {
	const {
		cframe_content_path: cframeContentPath,
		html_file_name: htmlFileName,
		html_title: htmlTitle,
	} = env;

	const cframePath = Path.dirname(new URL(import.meta.url).pathname);

	return Fs.readFile(Path.join(cframePath, './src/template.ejs'), { encoding: 'utf-8' }).then((cframeContent) => {
		return Fs.readFile(cframeContentPath, { encoding: 'utf-8' }).then((content) => {
			const headMatch = content.match(/<!-- HEAD -->(.*?)<!-- HEAD END -->/s);
			const bodyMatch = content.match(/<!-- BODY -->(.*?)<!-- BODY END -->/s);
			const footerMatch = content.match(/<!-- FOOTER -->(.*?)<!-- FOOTER END -->/s);

			cframeContent = cframeContent
				.replace('<!-- HEAD -->', headMatch ? headMatch[1] : '')
				.replace('<!-- BODY -->', bodyMatch ? bodyMatch[1] : '')
				.replace('<!-- FOOTER -->', footerMatch ? footerMatch[1] : '');

			return Fs.mkdir('./tmp/assets', { recursive: true }).then(() => {
				return Promise.all([
					Fs.readdir(Path.join(cframePath, './src/assets')).then((files) => {
						return Promise.all(files.map((file) => {
							return Fs.lstat(Path.join(cframePath, `./src/assets/${file}`)).then((lstat) => {
								if (lstat.isDirectory()) return null;
								return Fs.copyFile(Path.join(cframePath, `./src/assets/${file}`), Path.join(`./tmp/assets/${file}`));
							});
						}));
					}, (error) => {
						console.error(error);
					}),
					Fs.writeFile('./tmp/template.ejs', cframeContent, { encoding: 'utf-8' })
				]);
			});
		});
	}).then(() => {
		return {
			plugins: [
				new HtmlWebpackPlugin({
					title: htmlTitle,
					filename: htmlFileName,
					template: './tmp/template.ejs',
					inject: false
				}),
				new Webpack.ProvidePlugin({
					$: 'jquery',
					jQuery: 'jquery'
				})
			],
			resolve: {
				alias: {
					cframe: Path.resolve(cframePath, './src/script.ts')
				}
			}
		};
	});
}
