import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";

/**
 * Storybook configuration.
 *
 * Three deliberate constraints:
 *
 * 1. Stories import components through the `uireload/components/*` specifier, the
 *    same path consumers use. If a story can only be written via a relative import,
 *    the export map is wrong and Storybook is where we find out. The alias below maps
 *    those specifiers back to source so the dev server stays fast.
 * 2. Stories are colocated with components (`src/components/*\/*.stories.tsx`)
 *    rather than in a top-level folder, so a component cannot be added without its
 *    documentation.
 * 3. Types are checked once, by `npm run typecheck`. Doing it again in Storybook only
 *    slows `storybook dev` down and duplicates errors across terminals.
 */

const SRC = fileURLToPath(new URL("../src", import.meta.url));

/** Mirrors the `exports` map in package.json, resolved against source. */
const aliases = [
  { find: /^uireload\/components\/(.+)$/, replacement: `${SRC}/components/$1` },
  { find: /^uireload$/, replacement: `${SRC}/index.ts` },
];

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-essentials", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
  typescript: {
    check: false,
    reactDocgen: "react-docgen-typescript",
  },
  viteFinal: async (config) => {
    config.resolve ??= {};

    // Vite's `alias` is `Alias[] | Record<string, string>`. Normalise before
    // prepending so we never hand it a mixed shape.
    const existing = config.resolve.alias;
    config.resolve.alias = [...aliases, ...(Array.isArray(existing) ? existing : [])];

    return config;
  },
};

export default config;
