import { writeFile } from 'fs/promises';
import { join } from 'path';
import Clipgen from '../src';

const clipgen = new Clipgen();
(async () => {
	await clipgen.init();

	const config = clipgen.createConfig({
		name: 'S0n1c\'s Site',
		author: 'S0n1c',
		desc: 'A test webclip'
	});

	config.webclips.add({
		name: 'S0n1c',
		url: 'https://s0n1c.ca',
		icon_path: 'https://s0n1c.ca/me.png'
	});

	const data = await config.compile();
	const buf = Buffer.from(data);
	await writeFile(join(__dirname, 'app.mobileconfig'), buf.toString(), { encoding: 'utf-8' });
})();
