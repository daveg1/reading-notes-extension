import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
	server: {
		port: 5173,
		strictPort: true,
		hmr: {
			port: 5173,
		},
	},
	plugins: [crx({ manifest })],
});
