import { v4 } from 'uuid';
import Clipgen from '.';
import BaseStore from './BaseStore';

export interface WebClipData {
	id?: string
	name: string
	url: string
	icon_path: string | ArrayBufferLike
}

export interface WebClip extends WebClipData {
	id: string
	icon: Uint8Array
}

export interface PackageData {
	id?: string
	name: string
	url: string
	icon_path?: string
	bundleid?: string
}

export interface Package extends PackageData {
	id: string
}

export interface SigningData {
	key: string
	cert: string
}

export interface ConfigBase {
	name: string
	author: string
	desc: string
	signing?: SigningData
}

export class WebClips extends BaseStore<string, WebClipData> {
	add(data: WebClipData): WebClipData {
		const id = this.genString();
		data.id = id;
		this.set(id, data);
		return this.get(id);
	}

	genString(length = 10): string {
		var result = '';
		var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		var charactersLength = characters.length;
		for (var i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		return result;
	}
}

export class Packages extends BaseStore<string, PackageData> {
	add(data: PackageData): PackageData {
		const id = this.genString();
		data.id = id;
		this.set(id, data);
		return this.get(id);
	}

	genString(length = 10): string {
		var result = '';
		var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		var charactersLength = characters.length;
		for (var i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() * charactersLength));
		}
		return result;
	}
}

export interface PackageKind {
	kind: 'software-package'
	url: string
}

export interface DisplayKind {
	kind: 'display-image' | 'full-size-image'
	'needs-shine': boolean
	url: string
}

export type assetKind = PackageKind | DisplayKind

export interface AdHocPayload {
	assets: assetKind[],
	metadata: {
		'bundle-identifier': string
		'bundle-version': string
		'kind': 'software'
		'platform-identifier': 'com.apple.platform.iphoneos'
		'title': string
	}
}

export type ConfigType = 'adhoc' | 'web'

export interface ConfigWeb extends ConfigBase {
	type: 'web'
}

export interface ConfigAdHoc extends ConfigBase {
	type?: 'adhoc'
}

export type ConfigInfo = ConfigWeb | ConfigAdHoc;


export class Config {
	name: string;
	author: string;
	desc: string
	type?: ConfigType
	signing?: SigningData
	webclips?: WebClips
	packages: Packages
	// eslint-disable-next-line no-unused-vars


	private inst: Clipgen
	isWeb(): this is ConfigWeb {
		return (this as ConfigWeb).type === 'web';
	}

	isAdHoc(): this is ConfigAdHoc {
		return (this as ConfigAdHoc).type === 'adhoc';
	}

	constructor(data: Partial<ConfigInfo>, inst: Clipgen) {
		Object.defineProperty(this, 'inst', {
			value: inst,
			writable: true,
			configurable: true
		});
		this.name = data.name || 'Unknown';
		this.author = data.author || 'Unknown';
		this.desc = data.desc || `Type: ${this.type}`;
		if (typeof data.signing !== 'undefined') {
			this.signing = data.signing;
		}

		this.type = data.type || 'web';

		switch (this.type) {
			case 'adhoc':
				this.packages = new Packages();
				break;
			case 'web':
				this.webclips = new WebClips();
				break;
		}
	}


	isURL(url: string): boolean {
		if (url.startsWith('data:image') || url.startsWith('blob:')) {
			return true;
		}
		try {
			if (this.inst.isNode) {
				new this.inst.mod.URL(url);
			} else {
				new URL(url);
			}
		} catch (e) {
			return false;
		}
		return true;
	}

	async signConfig(config: unknown): Promise<Buffer> {
		const { signing } = this;
		return new Promise((resolve, reject) => this.inst.mod.getSignedConfig(config, signing, (err, data) => err ? reject(err) : resolve(data)));
	}

	async compile(): Promise<ArrayBufferLike> {
		switch (this.type) {
			case 'adhoc':
				return this.compileAdhoc();
			case 'web':
				return this.compileClip();
		}
	}

	private async compileAdhoc(): Promise<ArrayBufferLike> {
		const app_uuid = v4().toUpperCase();
		const PayloadContent: AdHocPayload[] = [];
		if (typeof this.packages !== 'undefined' && this.packages.size > 0) {
			for (const p of this.packages.array()) {
				const payload: AdHocPayload = {
					assets: [
						{
							kind: 'software-package',
							url: p.url
						}
					],
					metadata: {
						'bundle-identifier': p.bundleid ?? `ca.s0n1c.clipgen.${app_uuid}`,
						'bundle-version': '1.0',
						kind: 'software',
						'platform-identifier': 'com.apple.platform.iphoneos',
						title: p.name
					}
				};
				if (typeof p.icon_path !== 'undefined') {
					payload.assets.push({
						kind: 'display-image',
						'needs-shine': true,
						url: p.icon_path
					}, {
						kind: 'full-size-image',
						'needs-shine': true,
						url: p.icon_path
					});
				}

				PayloadContent.push(payload);
			}
		}
		const payload = {
			items: PayloadContent
		};

		const res = this.inst.mod.build(payload as any) as string;
		let buf: Uint8Array;
		if (this.inst.isNode) {
			const TE = (await import('util')).TextEncoder;
			const enc = new TE();
			buf = enc.encode(res);
		} else {
			const enc = new TextEncoder();
			buf = enc.encode(res);
		}
		return buf;
	}

	private async compileClip(): Promise<ArrayBufferLike> {
		const app_uuid = v4().toUpperCase();

		const PayloadContent = [];

		if (typeof this.webclips !== 'undefined' && this.webclips.size > 0) {
			for (const p of this.webclips.array()) {
				let icondata: Uint8Array;
				if (typeof p.icon_path === 'string' && this.inst.isNode) {
					icondata = new Uint8Array(Buffer.from(p.icon_path, 'base64').buffer);
				} else {
					console.log(typeof p.icon_path);
					if (typeof p.icon_path === 'string') {
						if (!this.isURL(p.icon_path)) {
							if (!this.inst.mod.fs.existsSync(p.icon_path)) {
								throw new Error('Icon path invalid.');
							}
							const rawIcon = this.inst.mod.fs.readFileSync(p.icon_path);
							icondata = new Uint8Array(rawIcon.buffer);
						} else {
							let rawIcon: ArrayBufferLike;
							if (this.inst.isNode) {
								rawIcon = await (await this.inst.mod.fetch(p.icon_path)).buffer();
							} else {
								rawIcon = await (await fetch(p.icon_path)).arrayBuffer();
							}
							icondata = new Uint8Array(rawIcon);
						}
					} else if (p.icon_path instanceof ArrayBuffer) {
						icondata = new Uint8Array(p.icon_path);
					}
				}
				const payload_uuid = v4().toUpperCase();
				PayloadContent.push({
					FullScreen: true,
					Icon: icondata,
					IsRemovable: true,
					Label: p.name,
					PayloadDescription: 'Web app bundled into a config, generated by @S0n1c_Dev',
					PayloadIdentifier: `com.apple.webClip.managed.${payload_uuid}`,
					PayloadType: 'com.apple.webClip.managed',
					PayloadUUID: payload_uuid,
					PayloadVersion: 1,
					Precomposed: true,
					URL: p.url
				});
			}
		}
		const payload = {
			PayloadContent,
			PayloadDescription: this.desc,
			PayloadDisplayName: this.name,
			PayloadIdentifier: `ca.s0n1c.ios.webclip.${app_uuid}`,
			PayloadOrganization: this.author,
			PayloadRemovalDisallowed: false,
			PayloadType: 'Configuration',
			PayloadUUID: app_uuid,
			PayloadVersion: 1
		};

		if (typeof this.signing !== 'undefined') {
			return this.signConfig(payload);
		}

		const res = this.inst.mod.build(payload as any);
		let buf: Uint8Array;
		if (this.inst.isNode) {
			const TE = (await import('util')).TextEncoder;
			const enc = new TE();
			buf = enc.encode(res);
		} else {
			const enc = new TextEncoder();
			buf = enc.encode(res);
		}

		return buf;
	}
}
