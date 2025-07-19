import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      "dist/**",
      "build/**",
      "node_modules/**",
      ".next/**",
      "coverage/**",
      "*.config.js",
      "*.config.ts",
      "public/**"
    ]
  },
  {
    ...js.configs.recommended,
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2024,
        ...globals.node,
      },
      parser: tsparser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // TypeScript rules for 2025
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_",
          "ignoreRestSiblings": true
        }
      ],
      "@typescript-eslint/no-explicit-any": "warn",

      // Modern JavaScript features
      "prefer-const": "error",
      "prefer-arrow-callback": "error",
      "prefer-template": "error",
      "object-shorthand": "error",
      "no-var": "error",
      "no-duplicate-imports": "error",

      "no-console": ["warn", { "allow": ["warn", "error"] }],
      // Security-focused rules
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",
      "no-caller": "error",
      "no-extend-native": "error",
      "no-extra-bind": "error",
      "no-iterator": "error",
      "no-label-var": "error",
      "no-labels": "error",
      "no-lone-blocks": "error",
      "no-loop-func": "error",
      "no-multi-str": "error",
      "no-global-assign": "error",
      "no-new-object": "error",
      "no-new-wrappers": "error",
      "no-octal": "error",
      "no-octal-escape": "error",
      "no-proto": "error",
      "no-return-assign": "error",
      "no-sequences": "error",
      "no-throw-literal": "error",
      "no-with": "error",
      "wrap-iife": "error",
      "yoda": "error",
    },
  }
];
