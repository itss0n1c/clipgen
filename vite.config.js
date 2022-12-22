import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
	build: {
		lib: {
			entry: resolve(__dirname, 'lib/index.ts'),
			name: 'Clipgen',
			fileName: 'index',
			formats: [ 'es' ]
		},
		sourcemap: 'inline',
		rollupOptions: {
			external: [ 'plist', 'crypto', 'mobileconfig' ]
		}
	},
	plugins: [ dts() ]
});
