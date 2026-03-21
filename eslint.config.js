// @ts-check
import eslint from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import importPlugin from "eslint-plugin-import";
import tseslint from "typescript-eslint";

export default defineConfig(
    eslint.configs.recommended,
    stylistic.configs.recommended,
    tseslint.configs.strict,
    tseslint.configs.stylistic,
    importPlugin.flatConfigs.recommended,
    importPlugin.flatConfigs.typescript,
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
                "import/extensions": ["error", "always"],
                "import/no-commonjs": "error",
                "import/order": "error",
                "no-duplicate-imports": "error",
                "prefer-const": "error",
            },
            plugins: {
                "@stylistic": stylistic,
            },
            settings: {
                "import/resolver": {
                    "node": true,
                    "typescript": true,
                },
            }
        },
        globalIgnores([
            "dist/",
        ]),
    ],
);