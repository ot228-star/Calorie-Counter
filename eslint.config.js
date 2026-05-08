const globals = require("globals");
const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
  {
    ignores: [
      "node_modules/",
      "dist/",
      "build/",
      ".expo/",
      "coverage/",
      "supabase/functions/**",
      "scripts/**"
    ]
  },
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.es2021,
        ...globals.node,
        ...globals.browser,
        __DEV__: "readonly"
      }
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off"
    }
  }
);
