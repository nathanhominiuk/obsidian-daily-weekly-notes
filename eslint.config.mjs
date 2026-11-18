import { defineConfig, globalIgnores } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
	// Build output and Node build scripts are not plugin code.
	globalIgnores(["node_modules", "main.js", "src/esbuild.config.mjs", "src/version-bump.mjs"]),
	...obsidianmd.configs.recommended,
	{
		languageOptions: {
			parserOptions: {
				projectService: {
					allowDefaultProject: ["eslint.config.mjs", "vitest.config.ts"],
				},
			},
		},
	},
	{
		// Tests stub Obsidian with loosely typed mocks and use the real Moment.js.
		files: ["**/*.test.ts", "**/__mocks__/**"],
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unsafe-argument": "off",
			"@typescript-eslint/no-unsafe-assignment": "off",
			"@typescript-eslint/no-unsafe-call": "off",
			"@typescript-eslint/no-unsafe-member-access": "off",
			"@typescript-eslint/no-restricted-imports": "off",
			// Moment.js is installed as a dependency of the obsidian package.
			"import/no-extraneous-dependencies": "off",
		},
	},
]);
