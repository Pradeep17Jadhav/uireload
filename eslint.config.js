import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist", "coverage", "storybook-static", "node_modules", "**/*.d.ts"],
  },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        projectService: {
          /*
           * Only plain-JS tooling lives outside `tsconfig.json`'s program: this
           * config file and the `scripts/*.mjs` utilities. Listing them explicitly
           * keeps type-aware linting everywhere else instead of degrading to
           * untyped parsing for the whole repo.
           */
          allowDefaultProject: ["*.config.js"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  /* ---------------------------------------------------------- source rules --- */
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // Library conventions that ESLint cannot infer from types alone.
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.name='require']",
          message: "UIReload ships ESM-first. Use import statements.",
        },
        {
          selector:
            "MemberExpression[object.object.name='document'][object.property.name=/^(body|head|documentElement)$/]",
          message: "Direct document mutation breaks SSR and CSP. Render into a container instead.",
        },
      ],

      // A component that spreads unknown props onto the DOM can emit invalid
      // attributes. Destructuring is required, which is what every component here does.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],

      // Floating promises hide real bugs in async interaction handlers.
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "prefer-const": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },

  /* ------------------------------------------------------------- test rules --- */
  {
    files: ["**/*.test.{ts,tsx}", "tests/**/*.{ts,tsx}"],
    rules: {
      // Tests legitimately reach into internals and use loose typing for fixtures.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/unbound-method": "off",

      // Tests own the DOM: they build fixtures by writing to `document.body`, which
      // is exactly what the source-level rule forbids in components.
      "no-restricted-syntax": "off",
    },
  },

  /* ------------------------------------------------------------ script rules --- */
  {
    files: ["scripts/**/*.mjs", "*.config.{ts,js}", ".storybook/**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      // Plain-JS tooling is `any` to the type system (no `checkJs`), so the
      // type-aware rules have nothing to work with here.
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/require-await": "off",
    },
  }
);
