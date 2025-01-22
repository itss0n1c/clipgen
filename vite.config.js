import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
	server: {
		host: true,
	},
	build: {
		lib: {
			entry: resolve(__dirname, "lib/index.ts"),
			name: "Clipgen",
			fileName: "index",
		},
		sourcemap: "inline",
		rollupOptions: {
			external: ["@plist/plist", "crypto", "mobileconfig"],
		},
	},
	plugins: [dts()],
});
