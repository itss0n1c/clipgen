import { writeFileSync } from 'fs';
import { join } from 'path';
import { Config } from '../src';

const config = new Config({
	name: 'S0n1c\'s Site',
	author: 'S0n1c',
	desc: 'A test webclip',
	id_prefix: 'ca.s0n1c.webclip'
});

config.webclips.add({
	name: 'S0n1c',
	url: 'https://s0n1c.ca',
	icon_path: 'https://s0n1c.ca/me.png'
});

config.compile().then((data) => {
	writeFileSync(join(__dirname, '..', 'app.mobileconfig'), data, { encoding: 'utf-8' });
});
