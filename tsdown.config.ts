import { defineConfig } from 'tsdown';

export default defineConfig({
	dts: true,
	minify: true,
	outExtensions: () => ({ dts: '.d.ts', js: '.js' }),
	entry: ['./lib/index.ts'],
});
