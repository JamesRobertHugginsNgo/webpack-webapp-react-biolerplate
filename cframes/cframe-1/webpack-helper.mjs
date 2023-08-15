import Fs from 'node:fs/promises';
import Path from 'node:path';

export default function makeTemplate(head, body, footer, destPath) {
	const cframePath = Path.dirname(new URL(import.meta.url).pathname);
	const cframeSrcPath = Path.join(cframePath, 'src');

	const srcTemplatePath = Path.join(cframeSrcPath, 'template.ejs');
	return Fs.readFile(srcTemplatePath, { encoding: 'utf-8' }).then((content) => {
		content = content
			.replace('<!-- HEAD -->', head)
			.replace('<!-- BODY -->', body)
			.replace('<!-- FOOTER -->', footer)

		const destAssetsPath = Path.join(destPath, 'assets');
		return Fs.mkdir(destAssetsPath, { recursive: true }).then(() => {
			const srcAssetsPath = Path.join(cframeSrcPath, 'assets');
			const destTemplatepath = Path.join(destPath, 'template.ejs');
			return Promise.all([
				Fs.readdir(srcAssetsPath).then((files) => {
					const promises = [];
					const length = files.length;
					for (let index = 0; index < length; index++) {
						const file = files[index];
						const srcFilePath = Path.join(srcAssetsPath, file);
						promises.push(Fs.lstat(srcFilePath).then((lstat) => {
							if (lstat.isDirectory()) return;
							const destFilePath = Path.join(destAssetsPath, file);
							return Fs.copyFile(srcFilePath, destFilePath);
						}));
					}
					return Promise.all(promises);
				}, (error) => {
					console.error(error);
				}),
				Fs.writeFile(destTemplatepath, content, { encoding: 'utf-8' })
			]).then(() => {
				return {
					aliasPath: Path.join(cframeSrcPath, 'script'),
					templatePath: destTemplatepath,
					providePlugin: {
						$: 'jquery',
						jQuery: 'jquery'
					}
				};
			});
		});
	});
}
