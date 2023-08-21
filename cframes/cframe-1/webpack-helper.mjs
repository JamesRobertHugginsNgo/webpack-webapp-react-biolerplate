import Fs from 'node:fs/promises';
import Path from 'node:path';

export const alias = './src/script.ts';

export function prepareTemplate(destPath, { head, body, footer }) {
	const cframePath = Path.dirname(new URL(import.meta.url).pathname);
	return Fs.readFile(Path.join(cframePath, './src/template.ejs'), { encoding: 'utf-8' }).then((content) => {
		content = content
			.replace('<!-- HEAD -->', head)
			.replace('<!-- BODY -->', body)
			.replace('<!-- FOOTER -->', footer);

		const cframeTemplatePath = Path.join(destPath, 'template.ejs');
		return Fs.mkdir(Path.join(destPath, 'assets'), { recursive: true }).then(() => {
			return Promise.all([
				Fs.readdir(Path.join(cframePath, './src/assets')).then((files) => {
					return Promise.all(files.map((file) => {
						return Fs.lstat(Path.join(cframePath, `./src/assets/${file}`)).then((lstat) => {
							if (lstat.isDirectory()) return null;
							return Fs.copyFile(Path.join(cframePath, `./src/assets/${file}`), Path.join(destPath, `assets/${file}`));
						});
					}));
				}, (error) => {
					console.error(error);
				}),
				Fs.writeFile(cframeTemplatePath, content, { encoding: 'utf-8' })
			]).then(() => {
				return cframeTemplatePath;
			});
		});
	});
}

export const providePlugins = {
	$: 'jquery',
	jQuery: 'jquery'
};
