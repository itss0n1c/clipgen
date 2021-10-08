import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Config } from '../src';

const config = new Config({
	name: 'S0n1c\'s Site',
	author: 'S0n1c',
	desc: 'A test webclip',
	signing: {
		key: readFileSync(join(__dirname, 'key.pem'), { encoding: 'utf-8' }),
		cert: readFileSync(join(__dirname, 'cert.pem'), { encoding: 'utf-8' })
	}
});

config.webclips.add({
	name: 'S0n1c',
	url: 'https://s0n1c.ca',
	icon_path: 'https://s0n1c.ca/me.png'
});

config.compile().then((data) => {
	const buf = Buffer.from(data);
	writeFileSync(join(__dirname, '..', 'app.mobileconfig'), buf.toString(), { encoding: 'utf-8' });
}).catch((e) => {
	console.trace(e);
});
