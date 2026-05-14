// Copyright (c) 2026- taisyu shibata
// SPDX-License-Identifier: Apache-2.0

module.exports = [
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/coverage/**"]
  },
  {
    files: ["viewer/src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        console: "readonly",
        window: "readonly",
        document: "readonly",
        Blob: "readonly",
        clearInterval: "readonly",
        structuredClone: "readonly",
        URL: "readonly",
        localStorage: "readonly",
        setInterval: "readonly"
      }
    },
    rules: {
      "no-undef": "error",
      "no-redeclare": "error",
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ]
    }
  },
  {
    files: ["viewer/test/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        console: "readonly"
      }
    },
    rules: {
      "no-undef": "error",
      "no-redeclare": "error",
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ]
    }
  },
  {
    files: ["viewer/src/**/*.jsx"],
    rules: {
      "no-unused-vars": "off"
    }
  },
  {
    files: ["viewer/vite.config.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly"
      }
    },
    rules: {
      "no-undef": "error",
      "no-redeclare": "error",
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ]
    }
  },
  {
    files: ["**/*.js"],
    ignores: ["viewer/src/**", "viewer/test/**", "viewer/vite.config.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        console: "readonly",
        process: "readonly",
        module: "readonly",
        require: "readonly",
        __dirname: "readonly"
      }
    },
    rules: {
      "no-undef": "error",
      "no-redeclare": "error",
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ]
    }
  }
];
