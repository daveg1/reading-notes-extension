import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
	build: {
		outDir: './build',
	},
	server: {
		port: 5173,
		strictPort: true,
		hmr: {
			port: 5173,
		},
	},
	plugins: [crx({ manifest }), topLevelAwait()],
});
