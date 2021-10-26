import { Config, ConfigInfo } from './Config';

export interface ClipgenOpts {
	node: boolean
}

export default class Clipgen {
	mod: {
		// eslint-disable-next-line no-unused-vars
		getSignedConfig?: (plistData: any, keys: {key: string, cert: string}, callback: (err: any, data: Buffer) => void) => void
		fs?: any
		build?: any
		parse?: any
		URL?: any
		fetch?: any
	} = {}

	isNode: boolean

	constructor(opts?: Partial<ClipgenOpts>) {
		this.isNode = typeof opts !== 'undefined' ? opts.node ?? false : false;
	}


	async init(): Promise<void> {
		if (this.isNode) {
			console.log('Running on NodeJS');
			await this.initNode();
		} else {
			// eslint-disable-next-line no-undef
			this.mod.build = globalThis.plist.build;
			// eslint-disable-next-line no-undef
			this.mod.parse = globalThis.plist.parse;
		}
	}

	async initNode(): Promise<void> {
		this.mod.getSignedConfig = (await import('mobileconfig')).default.getSignedConfig;
		this.mod.fetch = (await import('node-fetch')).default;
		this.mod.build = (await import('plist')).build;
		this.mod.parse = (await import('plist')).parse;
		this.mod.fs = (await import('fs')).default;
		this.mod.URL = (await import('url')).default.URL;
	}

	createConfig(data: Partial<ConfigInfo>): Config {
		return new Config(data, this);
	}
}
