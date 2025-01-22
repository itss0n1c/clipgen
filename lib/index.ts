import { serialize } from '@plist/plist';
import type {
	ClipgenAdhocBuildParams,
	ClipgenAdhocItemPayload,
	ClipgenAdhocPayload,
	ClipgenBuildParams,
	ClipgenWebclipBuildParams,
	ClipgenWebclipMobileconfig,
} from './types';

export class ClipgenError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ClipgenError';
	}
}

const _get_icon = (icon: URL | ArrayBufferLike) =>
	icon instanceof URL
		? fetch(icon)
				.then((r) => r.arrayBuffer())
				.then((r) => new Uint8Array(r))
		: new Uint8Array(icon);

const gen_uuid = () => crypto.randomUUID().toUpperCase();

// biome-ignore lint/suspicious/noExplicitAny: plist lib's Value isn't compatible with Clipgen types.
const build = (data: ClipgenAdhocPayload | ClipgenWebclipMobileconfig) => serialize(data as any, 1);

function _generate_adhoc(data: ClipgenAdhocBuildParams) {
	const config: ClipgenAdhocPayload = {
		items: [],
	};

	for (const item of data.items) {
		const payload: ClipgenAdhocItemPayload = {
			assets: [
				{
					kind: 'software-package',
					url: item.url,
				},
			],
			metadata: {
				'bundle-identifier': item.identifier,
				'bundle-version': item.version,
				kind: 'software',
				'platform-identifier': 'com.apple.platform.iphoneos',
				title: item.name,
			},
		};
		if (item.icon) {
			payload.assets.push({
				kind: 'display-image',
				'needs-shine': false,
				url: item.icon,
			});
			payload.assets.push({
				kind: 'full-size-image',
				'needs-shine': false,
				url: item.icon,
			});
		}
		config.items.push(payload);
	}

	const res = build(config);
	const buf = new TextEncoder();
	return buf.encode(res);
}

async function _generate_web(data: ClipgenWebclipBuildParams) {
	const root_uuid = gen_uuid();

	const config: ClipgenWebclipMobileconfig = {
		PayloadContent: [],
		PayloadDisplayName: data.name,
		PayloadDescription: data.desc,
		PayloadIdentifier: `ca.s0n1c.clipgen.${root_uuid}`,
		PayloadOrganization: data.author,
		PayloadRemovalDisallowed: false,
		PayloadType: 'Configuration',
		PayloadUUID: root_uuid,
		PayloadVersion: 1,
	};

	for (const clip of data.clips) {
		const clip_uuid = gen_uuid();
		config.PayloadContent.push({
			Fullscreen: false,
			Icon: await _get_icon(clip.icon),
			IsRemovable: true,
			Label: clip.name,
			PayloadDescription: clip.name,
			PayloadIdentifier: `ca.s0n1c.clipgen.${clip_uuid}`,
			PayloadType: 'com.apple.webClip.managed',
			PayloadUUID: clip_uuid,
			PayloadVersion: 1,
			Precomposed: true,
			URL: clip.url,
		});
	}

	const res = build(config);
	const buf = new TextEncoder();
	return buf.encode(res);
}

/**
 * Generate a configuration profile.
 *
 * @throws {ClipgenError} If the build type is invalid.
 * @returns The configuration profile as a buffer.
 */
export async function generate(data: ClipgenBuildParams): Promise<ArrayBufferLike> {
	if (data.type === 'adhoc') return _generate_adhoc(data);
	if (data.type === 'web') return _generate_web(data);
	throw new ClipgenError('Invalid build type.');
}

export type * from './types';
