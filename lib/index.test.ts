import { expect, spyOn, test } from 'bun:test';
import { parse } from '@plist/plist';
import { ClipgenError, generate } from './index.ts';
import type { ClipgenWebclipBuildParams } from './types.ts';

const icon = Uint8Array.of(1, 2, 3);
const webclip: ClipgenWebclipBuildParams = {
	type: 'web',
	name: "S0n1c's Site",
	author: 'S0n1c',
	desc: 'A test webclip',
	clips: [{ name: 'S0n1c', url: 'https://s0n1c.ca', icon: icon.buffer }],
};

test('generates a Web Clip profile with embedded icon bytes', async () => {
	const config = await generate(webclip);

	expect(config).toBeInstanceOf(Uint8Array);
	expect(parse(new TextDecoder().decode(config))).toMatchObject({
		PayloadType: 'Configuration',
		PayloadDisplayName: webclip.name,
		PayloadOrganization: webclip.author,
		PayloadContent: [
			{ PayloadType: 'com.apple.webClip.managed', Label: 'S0n1c', URL: 'https://s0n1c.ca', Icon: icon.buffer },
		],
	});
});

test('rejects a failed icon download', async () => {
	const fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Not found', { status: 404 }));
	try {
		const result = generate({
			...webclip,
			clips: [{ name: 'S0n1c', url: 'https://s0n1c.ca', icon: new URL('https://example.com/icon.png') }],
		});
		await expect(result).rejects.toBeInstanceOf(ClipgenError);
		await expect(result).rejects.toThrow('HTTP 404');
	} finally {
		fetchMock.mockRestore();
	}
});

test('generates an ad hoc installation manifest', async () => {
	const item = {
		name: 'App & Co',
		url: 'https://example.com/App.ipa',
		icon: 'https://example.com/icon.png',
		identifier: 'com.example.app',
		version: '1.0.0',
	};
	const config = await generate({ type: 'adhoc', items: [item] });

	expect(parse(new TextDecoder().decode(config))).toEqual({
		items: [
			{
				assets: [
					{ kind: 'software-package', url: item.url },
					{ kind: 'display-image', 'needs-shine': false, url: item.icon },
					{ kind: 'full-size-image', 'needs-shine': false, url: item.icon },
				],
				metadata: {
					'bundle-identifier': item.identifier,
					'bundle-version': item.version,
					kind: 'software',
					'platform-identifier': 'com.apple.platform.iphoneos',
					title: item.name,
				},
			},
		],
	});
});
