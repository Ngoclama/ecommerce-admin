// eslint.config.mjs

import tseslint from "typescript-eslint";

export default [
  ...tseslint.configs.recommended,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "src/generated/**",
      "**/generated/**",
      "**/*.generated.*",
    ],
  },
  {
    rules: {
      // Make unused vars warnings instead of errors
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Make any types warnings instead of errors
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow @ts-ignore (but prefer @ts-expect-error) - make it a warning
      "@typescript-eslint/ban-ts-comment": "warn",
      // Prefer const but don't fail build
      "prefer-const": "warn",
    },
  },
];
