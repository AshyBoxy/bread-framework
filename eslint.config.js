import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import globals from "globals";
import ts from "typescript-eslint";

const tsConfigMain = ts.configs.recommended.map((config) => ({
    ...config, files: ["**/*.ts"]
}));
const tsConfigStylistic = ts.configs.stylistic.map((config) => ({
    ...config, files: ["**/*.ts"]
}));


export default [
    {
        ignores: [
            "**/dist", "**/node_modules"
        ]
    },
    js.configs.recommended,
    {
        plugins: {
            "@typescript-eslint": ts.plugin,
            "@stylistic": stylistic
        },

        languageOptions: {
            globals: {
                ...globals.node
            },
            parser: ts.parser,
            ecmaVersion: 2022,
            sourceType: "module"
        },

        rules: {
            "no-console": "error",

            "no-extra-boolean-cast": [
                "error", {
                    enforceForLogicalOperands: true
                }
            ],

            "no-template-curly-in-string": "error",
            "no-unreachable-loop": "error",
            curly: [
                "error", "multi"
            ],
            "default-case-last": "error",
            "default-case": "error",
            "dot-notation": "error",
            eqeqeq: "error",
            "no-empty-function": "error",
            "no-lone-blocks": "error",
            "require-await": "error",
            yoda: "error",

            "array-bracket-newline": [
                "error", "consistent"
            ],

            camelcase: "error",
            "comma-dangle": [
                "error", "never"
            ],
            "comma-style": [
                "error", "last"
            ],
            "linebreak-style": [
                "error", "unix"
            ],
            "new-parens": "error",
            "no-trailing-spaces": "error",
            "no-unneeded-ternary": "error",
            "no-whitespace-before-property": "error",
            "operator-assignment": "error",
            "arrow-body-style": [
                "error", "as-needed"
            ],
            "arrow-parens": "error",
            "no-var": "error",

            "prefer-const": [
                "error", {
                    destructuring: "any"
                }
            ],

            "prefer-template": "error",
            "template-curly-spacing": "error",

            "quote-props": [
                "error", "as-needed", {
                    numbers: true
                }
            ],

            "comma-spacing": "off",
            quotes: "off",
        }
    },
    ...tsConfigMain,
    ...tsConfigStylistic,
    {
        files: ["**/*.ts"],

        rules: {
            "@typescript-eslint/explicit-function-return-type": ["error", {
                allowExpressions: true
            }],
            "@stylistic/comma-spacing": "error",

            "@stylistic/quotes": [
                "error", "double", {
                    avoidEscape: true
                }
            ],

            "@typescript-eslint/no-var-requires": "off",
            "@typescript-eslint/no-namespace": "off",
            "no-shadow": "off",
            "@typescript-eslint/no-shadow": ["error"],

            "@typescript-eslint/consistent-type-assertions": [
                "error", {
                    assertionStyle: "angle-bracket",
                    objectLiteralTypeAssertions: "never"
                }
            ]
        }
    },
    {
        rules: {
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": ["error", {
                vars: "all",
                varsIgnorePattern: "^_",
                args: "after-used",
                caughtErrors: "none"
            }],
            "@typescript-eslint/prefer-for-of": "warn"
        }
    }
];
