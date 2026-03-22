import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
	test: {
		globals: true,
		alias: {
			'obsidian': resolve(__dirname, 'src/__mocks__/obsidian.ts'),
		},
		setupFiles: ['./src/test-setup.ts'],
	},
});
