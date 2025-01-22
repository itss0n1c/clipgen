# Clipgen

A web clip and adhoc config generator.

## Installation

```bash
$ bun i clipgen
```

## Usage

For webclips:

```ts
import { generate } from 'clipgen';

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
	]
});

console.log(config); // outputs the generated config as an ArrayBuffer
```

For adhoc configs:

```ts
import { generate } from 'clipgen';

let config = await generate({
	type: 'adhoc',
	items: [
		{
			name: 'App Name',
			url: 'https://example.com/App.ipa',
			icon: 'https://example.com/AppIcon.png',
			identifier: 'com.example.app',
		},
	],
});

console.log(config); // outputs the generated config as an ArrayBuffer
```
