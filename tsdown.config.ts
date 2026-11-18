import { defineConfig } from 'tsdown';

export default defineConfig({
	format: 'esm',
	platform: 'neutral',
	dts: true,
	minify: true,
	outExtensions: () => ({ dts: '.d.ts', js: '.js' }),
	entry: ['./lib/index.ts'],
});
