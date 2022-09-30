declare module 'jsrsasign' {
	export const asn1: any;
}

declare module 'mobileconfig' {
	// eslint-disable-next-line no-unused-vars
	function getSignedConfig(plistData: any, keys: { key: string; cert: string }, callback: (err: any, data: Buffer) => void): void;
}
