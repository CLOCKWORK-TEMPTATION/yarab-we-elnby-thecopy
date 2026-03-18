const typescriptParser = require("@typescript-eslint/parser");
const typescriptPlugin = require("@typescript-eslint/eslint-plugin");
const importPlugin = require("eslint-plugin-import");
const reactPlugin = require("eslint-plugin-react");
const reactHooksPlugin = require("eslint-plugin-react-hooks");

module.exports = [
  // Ignore patterns
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "**/dist/**",
      "**/.git/**",
      "**/coverage/**",
      "**/*.config.js",
      "**/*.config.mjs",
      "**/*.config.ts",
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.spec.tsx",
      "**/__tests__/**",
      "**/__smoke__/**",
    ],
  },

  // Base configuration
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@typescript-eslint": typescriptPlugin,
      "import": importPlugin,
      "react": reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      "react/no-unescaped-entities": "off",
      "react/no-direct-mutation-state": "off",
      "react-hooks/rules-of-hooks": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },

  // Named exports enforcement for src files
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    ignores: [
      "src/app/**/*.tsx",
      "src/app/**/*.ts",
      "src/middleware.ts",
      "src/**/middleware.ts",
      "src/components/**/*.tsx",
      "src/components/**/*.ts",
      "src/ai/**/*.ts",
      "src/ai/**/*.tsx",
      "src/lib/**/*.ts",
      "src/lib/**/*.tsx",
      "src/config/**/*.ts",
      "src/config/**/*.tsx",
      "src/global.d.ts",
      "src/workers/**/*.ts",
    ],
    rules: {
      "import/no-default-export": "error",
    },
  },

  // Complexity guardrails for Directors Studio page
  {
    files: ["src/app/(main)/directors-studio/page.tsx"],
    rules: {
      complexity: ["error", 8],
      "max-lines-per-function": [
        "error",
        { max: 50, skipBlankLines: true, skipComments: true },
      ],
      "max-lines": [
        "error",
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
    },
  },
];
