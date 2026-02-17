import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import jsdoc from "eslint-plugin-jsdoc";

export default tseslint.config(
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	eslintConfigPrettier,
	{
		plugins: {
			jsdoc,
		},
		languageOptions: {
			parserOptions: {
				project: "./tsconfig.json",
			},
		},
		rules: {
			// TypeScript specific
			"@typescript-eslint/explicit-function-return-type": "warn",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{ argsIgnorePattern: "^_" },
			],
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-unsafe-function-type": "off",

			// JSDoc rules
			"jsdoc/require-jsdoc": [
				"warn",
				{
					publicOnly: true,
					require: {
						FunctionDeclaration: true,
						MethodDefinition: true,
						ClassDeclaration: true,
						ArrowFunctionExpression: false,
						FunctionExpression: false,
					},
				},
			],
			"jsdoc/require-description": "warn",
			"jsdoc/require-param-description": "warn",
			"jsdoc/require-returns-description": "warn",
			"jsdoc/check-param-names": "error",
			"jsdoc/check-tag-names": "off",
		},
	},
	{
		ignores: [
			"dist/**",
			"node_modules/**",
			"examples/**",
			"*.js",
			"*.mjs",
			"tests/**",
			"src/qr.legacy.ts",
			"vitest.config.ts",
			"eslint.config.mjs",
		],
	},
);
