export interface ClipgenWebclipPayloadContent {
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

export interface ClipgenWebclipMobileconfig {
	PayloadContent: ClipgenWebclipPayloadContent[];
	PayloadDisplayName: string;
	PayloadDescription: string;
	PayloadIdentifier: string;
	PayloadOrganization: string;
	PayloadRemovalDisallowed: boolean;
	PayloadType: string;
	PayloadUUID: string;
	PayloadVersion: number;
}

export interface ClipgenAdhocPackageKind {
	kind: 'software-package';
	url: string;
}

export interface ClipgenAdhocDisplayKind {
	kind: 'display-image' | 'full-size-image';
	'needs-shine': boolean;
	url: string;
}

export type ClipgenAdhocAssetKind = ClipgenAdhocPackageKind | ClipgenAdhocDisplayKind;

export interface ClipgenAdhocItemPayload {
	assets: ClipgenAdhocAssetKind[];
	metadata: {
		'bundle-identifier': string;
		'bundle-version': string;
		kind: 'software';
		'platform-identifier': 'com.apple.platform.iphoneos';
		title: string;
	};
}

export interface ClipgenAdhocPayload {
	items: ClipgenAdhocItemPayload[];
}

export interface ClipgenAdhocItemPayloadParams {
	name: string;
	url: string;
	icon?: string;
	identifier: string;
	version: string;
}

export interface ClipgenAdhocBuildParams {
	type: 'adhoc';
	items: ClipgenAdhocItemPayloadParams[];
}

export interface ClipgenWebclipPayload {
	name: string;
	url: string;
	icon: URL | ArrayBufferLike;
}

export interface ClipgenWebclipBuildParams {
	type: 'web';
	name: string;
	author: string;
	desc: string;
	clips: ClipgenWebclipPayload[];
}

export type ClipgenBuildParams = ClipgenAdhocBuildParams | ClipgenWebclipBuildParams;

export type ClipgenBuildType = ClipgenBuildParams['type'];
