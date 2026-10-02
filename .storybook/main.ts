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
  /*
   * No negation here, and that is deliberate.
   *
   * `_template` used to be published as a component: `index.json` listed `template-example--*`
   * alongside the nine real ones and it appeared in the sidebar as "Template/Example", so a
   * screenshot review or visual-regression sweep would pick up scaffolding.
   *
   * Storybook's `!`-negated `stories` globs were tried in two forms -- one excluding the whole
   * `_template` directory and one excluding only `*.stories.tsx` beneath it -- and neither
   * excluded anything: both builds
   * still emitted all six template stories. Rather than depend on negation behaviour that is not
   * observable here, the template's story file is named `example.stories.template.tsx`, so the glob
   * cannot match it at all. `tests/stories.test.ts` fails if a `*.stories.tsx` reappears under
   * `_template`.
   *
   * The template remains a complete, copyable starting point: `AGENTS.md` section 5 step 5 already
   * requires renaming every `example` occurrence when copying it, so this suffix is renamed too.
   */
  stories: ["../src/**/*.stories.@(ts|tsx)"],
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
