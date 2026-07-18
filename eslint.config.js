import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: ["**/node_modules/**", "client/dist/**", "**/coverage/**"]
  },

  // Base recommended rules for all JS.
  js.configs.recommended,

  // Client: React + browser environment.
  {
    files: ["client/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser },
      parserOptions: {
        ecmaFeatures: { jsx: true }
      }
    },
    settings: {
      react: { version: "detect" }
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // This project intentionally uses plain JSX with no PropTypes or
      // TypeScript, so prop-type validation is not enforced.
      "react/prop-types": "off",
      // Too aggressive for this app: it flags the legitimate pattern of
      // resetting local UI state when the route :id param changes.
      "react-hooks/set-state-in-effect": "off"
    }
  },

  // Client tests: add test-runner globals.
  {
    files: ["client/**/*.test.{js,jsx}"],
    languageOptions: {
      globals: { ...globals.node }
    }
  },

  // Server: Node environment, ES modules.
  {
    files: ["server/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.node }
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }]
    }
  },

  // Turn off stylistic rules that Prettier owns.
  prettier
];
