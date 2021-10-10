import plist from 'plist';
import { Config, ConfigInfo } from './Config';

function isNode(): boolean {
	// Check if the environment is Node.js
	if (typeof __dirname !== 'undefined' && typeof process === 'object') {
		return true;
	}

	return false;
}

export default class Clipgen {
	mod: {
		// eslint-disable-next-line no-unused-vars
		getSignedConfig?: (plistData: any, keys: {key: string, cert: string}, callback: (err: any, data: Buffer) => void) => void
		fs?: any
		build?: typeof plist.build
		parse?: typeof plist.parse
		URL?: any
		fetch?: any
	} = {}

	isNode = isNode()

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
		this.mod.build = plist.build;
		this.mod.parse = plist.parse;
		this.mod.fs = (await import('fs')).default;
		this.mod.URL = (await import('url')).default.URL;
	}

	createConfig(data: Partial<ConfigInfo>): Config {
		return new Config(data, this);
	}
}
