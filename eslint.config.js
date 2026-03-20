// @ts-check
import eslint from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
    eslint.configs.recommended,
    tseslint.configs.strict,
    tseslint.configs.stylistic,
    [
        {
            languageOptions: {
                globals: {
                    ...globals.node,
                },
                parser: tsParser,
            },
            rules: {
                "@stylistic/comma-dangle": ["error", "always-multiline"],
                "@stylistic/indent": ["error", 4, { "SwitchCase": 1 }],
                "@stylistic/linebreak-style": ["error", "unix"],
                "@stylistic/quotes": ["error", "double"],
                "@stylistic/semi": ["error", "always"],
                "@stylistic/space-before-function-paren": [
                    "error", 
                    {
                        "anonymous": "always",
                        "named": "never",
                        "asyncArrow": "always",
                        "catch": "always",
                    },
                ],
                "camelcase": "error",
                "no-duplicate-imports": "error",
                "prefer-const": "error",
                "simple-import-sort/imports": "error",
                "simple-import-sort/exports": "error",
            },
            plugins: {
                "@stylistic": stylistic,
                "simple-import-sort": simpleImportSort,
            },
        },
    ],
);