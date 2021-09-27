import { existsSync, readFileSync } from 'fs';
import { getSignedConfig } from 'mobileconfig';
import fetch from 'node-fetch';
import { build } from 'plist';
import { URL } from 'url';
import { v4 } from 'uuid';
import BaseStore from './BaseStore';

export interface WebClipData {
	name: string
	url: string
	icon_path: string
}

export interface WebClip extends WebClipData {
	id: string
	icon: Uint8Array
}

export interface PackageData {
	name: string
	url: string
	icon_path: string
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
	kind: 'display-image'
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

	isWeb(): this is ConfigWeb {
		return (this as ConfigWeb).type === 'web';
	}

	isAdHoc(): this is ConfigAdHoc {
		return (this as ConfigAdHoc).type === 'adhoc';
	}

	constructor(data: Partial<ConfigInfo>) {
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
		try {
			new URL(url);
		} catch (e) {
			return false;
		}
		return true;
	}

	async signConfig(config: unknown): Promise<Buffer> {
		const { signing } = this;
		return new Promise((resolve, reject) => getSignedConfig(config, signing, (err, data) => err ? reject(err) : resolve(data)));
	}

	async compile(): Promise<Buffer> {
		switch (this.type) {
			case 'adhoc':
				return this.compileAdhoc();
			case 'web':
				return this.compileClip();
		}
	}

	private async compileAdhoc(): Promise<Buffer> {
		const app_uuid = v4().toUpperCase();
		const PayloadContent: AdHocPayload[] = [];
		if (typeof this.packages !== 'undefined' && this.packages.size > 0) {
			for (const p of this.packages.array()) {
				PayloadContent.push({
					assets: [
						{
							kind: 'software-package',
							url: p.url
						},
						{
							kind: 'display-image',
							'needs-shine': true,
							url: p.icon_path
						}
					],
					metadata: {
						'bundle-identifier': `ca.s0n1c.clipgen.${app_uuid}`,
						'bundle-version': '1',
						kind: 'software',
						title: p.name
					}
				});
			}
		}
		const payload = {
			items: PayloadContent
		};

		const res = build(payload as any);
		return Buffer.from(res);
	}

	private async compileClip(): Promise<Buffer> {
		const app_uuid = v4().toUpperCase();

		const PayloadContent = [];

		if (typeof this.webclips !== 'undefined' && this.webclips.size > 0) {
			for (const p of this.webclips.array()) {
				let icondata: Uint8Array;
				if (!this.isURL(p.icon_path)) {
					if (!existsSync(p.icon_path)) {
						throw new Error('Icon path invalid.');
					}
					const rawIcon = readFileSync(p.icon_path);
					icondata = new Uint8Array(rawIcon.buffer);
				} else {
					const rawIcon = await fetch(p.icon_path).then(r => r.buffer());
					icondata = new Uint8Array(rawIcon.buffer);
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

		const res = build(payload as any);

		// console.log(res);
		return Buffer.from(res);
	}
}
