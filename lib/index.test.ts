import { test } from 'bun:test';
import { generate } from './index.ts';

test('generates a webclip config', async () => {
	const config = await generate({
		type: 'web',
		name: "S0n1c's Site",
		author: 'S0n1c',
		desc: 'A test webclip',
		clips: [
			{
				name: 'S0n1c',
				url: 'https://s0n1c.ca',
				icon: new URL('https://s0n1c.ca/me.png'), // or an ArrayBufferLike
			},
		],
	});

	console.log(config);
	const blob = new Blob([config], { type: 'text/plain' });
	const url = URL.createObjectURL(blob);

	console.log(url);
});
