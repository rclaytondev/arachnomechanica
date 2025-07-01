import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

export default [...compat.extends(
	"eslint:recommended",
	"plugin:@typescript-eslint/eslint-recommended",
	"plugin:@typescript-eslint/recommended",
), {
	plugins: {
		"@typescript-eslint": typescriptEslint,
	},

	languageOptions: {
		globals: {
			...globals.node,
		},

		ecmaVersion: 12,
		sourceType: "module",

		parserOptions: {
			parser: "@typescript-eslint/parser",
		},
	},

	rules: {
		quotes: ["error", "double"],
		semi: ["error", "always"],
		"no-multi-spaces": ["error"],
		"comma-dangle": ["error", "always-multiline"],
		"no-mixed-spaces-and-tabs": ["error"],
		"prefer-template": ["error"],
		"template-curly-spacing": ["error", "never"],
		"func-style": ["error", "expression"],
		"@typescript-eslint/no-var-requires": 0,
		"no-trailing-spaces": ["error"],
		"no-console": ["error"],

		"no-constant-condition": ["error", {
			checkLoops: false,
		}],

		"@typescript-eslint/no-unused-vars": [
			"error",
			{
				"args": "after-used",
				"argsIgnorePattern": "^_",
				"caughtErrors": "all",
				"caughtErrorsIgnorePattern": "^_",
				"destructuredArrayIgnorePattern": ".*",
				"varsIgnorePattern": "^_",
				"ignoreRestSiblings": true,
			},
		],
	},
}];
