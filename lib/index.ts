interface PayloadContent {
	Fullscreen: boolean;
	Icon: Uint8Array;
	IsRemovable: boolean;
	Label: string;
	PayloadDescription: string;
	PayloadIdentifier: string;
	PayloadType: string;
	PayloadUUID: string;
	PayloadVersion: number;
	Precomposed: boolean;
	URL: string;
}

interface Mobileconfig {
	PayloadContent: PayloadContent[];
	PayloadDisplayName: string;
	PayloadDescription: string;
	PayloadIdentifier: string;
	PayloadOrganization: string;
	PayloadRemovalDisallowed: boolean;
	PayloadType: string;
	PayloadUUID: string;
	PayloadVersion: number;
}

export interface AdhocPackageKind {
	kind: 'software-package';
	url: string;
}

export interface AdhocDisplayKind {
	kind: 'display-image' | 'full-size-image';
	'needs-shine': boolean;
	url: string;
}

export type assetKind = AdhocPackageKind | AdhocDisplayKind;

interface AdhocItem {
	assets: assetKind[];
	metadata: {
		'bundle-identifier': string;
		'bundle-version': string;
		kind: 'software';
		'platform-identifier': 'com.apple.platform.iphoneos';
		title: string;
	};
}

interface Adhoc {
	items: AdhocItem[];
}

export type ConfigType = 'adhoc' | 'web';

interface AdhocPayload {
	name: string;
	url: string;
	icon?: string;
	identifier: string;
}

interface AdhocConfig {
	type: 'adhoc';
	items: AdhocPayload[];
}

interface ClipPayload {
	name: string;
	url: string;
	icon: URL | ArrayBufferLike;
}

interface SigningData {
	key: string;
	cert: string;
}

interface ClipConfig {
	type: 'web';
	name: string;
	author: string;
	desc: string;
	clips: ClipPayload[];
	signing?: SigningData;
}

export type ConfigOpts = AdhocConfig | ClipConfig;

export class Config {
	static async render(config: ConfigOpts): Promise<ArrayBufferLike> {
		const inst = new Config();
		switch (config.type) {
			case 'adhoc':
				return inst.renderAdhoc(config);
			case 'web':
				return inst.renderWeb(config);
		}
	}

	private get isNode(): boolean {
		return typeof process !== 'undefined' && process.versions !== null && process.versions.node !== null;
	}

	private async build(data: Adhoc | Mobileconfig): Promise<string> {
		if (this.isNode) {
			return (await import('plist')).default.build(data as any);
		}
		return globalThis.plist.build(data as any);
	}

	private async randomUUID(): Promise<string> {
		if (this.isNode) {
			return (await import('crypto')).randomUUID().toUpperCase();
		}
		return crypto.randomUUID().toUpperCase();
	}

	private async renderAdhoc(data: AdhocConfig): Promise<ArrayBufferLike> {
		const config: Adhoc = {
			items: []
		};
		for (const item of data.items) {
			const payload: AdhocItem = {
				assets: [
					{
						kind: 'software-package',
						url: item.url
					}
				],
				metadata: {
					'bundle-identifier': item.identifier,
					'bundle-version': '1.0',
					kind: 'software',
					'platform-identifier': 'com.apple.platform.iphoneos',
					title: item.name
				}
			};
			if (item.icon) {
				payload.assets.push({
					kind: 'display-image',
					'needs-shine': false,
					url: item.icon
				});
				payload.assets.push({
					kind: 'full-size-image',
					'needs-shine': false,
					url: item.icon
				});
			}
			config.items.push(payload);
		}
		const res = await this.build(config as any);
		const buf = new TextEncoder();
		return buf.encode(res);
	}

	private async renderWeb(data: ClipConfig): Promise<ArrayBufferLike> {
		const app_uuid = await this.randomUUID();
		const config: Mobileconfig = {
			PayloadContent: [],
			PayloadDisplayName: data.name,
			PayloadDescription: data.desc,
			PayloadIdentifier: `ca.s0n1c.clipgen.${app_uuid}`,
			PayloadOrganization: data.author,
			PayloadRemovalDisallowed: false,
			PayloadType: 'Configuration',
			PayloadUUID: app_uuid,
			PayloadVersion: 1
		};
		for (const clip of data.clips) {
			const clip_uuid = await this.randomUUID();
			config.PayloadContent.push({
				Fullscreen: false,
				Icon: await this.getIcon(clip.icon),
				IsRemovable: true,
				Label: clip.name,
				PayloadDescription: clip.name,
				PayloadIdentifier: `ca.s0n1c.clipgen.${clip_uuid}`,
				PayloadType: 'com.apple.webClip.managed',
				PayloadUUID: clip_uuid,
				PayloadVersion: 1,
				Precomposed: true,
				URL: clip.url
			});
		}
		if (data.signing) {
			return this.signConfig(config, data.signing);
		}
		const res = await this.build(config as any);
		const buf = new TextEncoder();
		return buf.encode(res);
	}

	private async signConfig(data: Mobileconfig, signing: SigningData): Promise<ArrayBufferLike> {
		if (!this.isNode) {
			throw new Error('Mobileconfig signing is only supported in Node.js');
		}
		// eslint-disable-next-line no-async-promise-executor
		const res = await new Promise<Buffer>(async (resolve, reject) =>
			(await import('mobileconfig')).default.getSignedConfig(data, signing, (err, data) => (err ? reject(err) : resolve(data)))
		);

		return res.buffer;
	}

	private async getIcon(icon: URL | ArrayBufferLike): Promise<Uint8Array> {
		if (icon instanceof URL) {
			const res = await fetch(icon);
			const buf = await res.arrayBuffer();
			return new Uint8Array(buf);
		}
		return new Uint8Array(icon);
	}
}
