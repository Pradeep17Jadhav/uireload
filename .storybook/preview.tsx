import type { Preview } from "@storybook/react";
/**
 * The published stylesheet, assembled by `scripts/bundle-css.mjs`.
 *
 * Importing the assembled `dist/index.css` rather than the source stylesheets is
 * deliberate:
 *
 * - Stories render exactly what a consumer gets, including cascade layer order. The
 *   bundler owns ordering, and a story must show its result rather than reimplement it.
 * - No story can be under-styled. A story importing only `./button.css` left every
 *   `ToggleButtonGroup` member with the browser's default grey, because the group renders
 *   ToggleButton which renders Button. That is invisible in production — the bundled
 *   stylesheet has everything — and glaring in Storybook.
 * - `npm run storybook` runs `build:css` first, so this is never stale.
 */
import "../dist/index.css";

/*
 * The two library stylesheets are imported here so every story gets tokens and base
 * styles. A story imports its own component stylesheet (`./widget.css`) because
 * component CSS is assembled into `uireload/styles.css` at build time rather than
 * imported from JavaScript.
 */

/*
 * Storybook preview.
 *
 * The toolbar exists to make the library's hard requirements observable:
 * direction, color scheme, and density. A component that only looks right in LTR
 * light mode at one density is not finished, and a Storybook that cannot switch
 * those hides the problem until a user reports it.
 */

type Direction = "ltr" | "rtl";
type Scheme = "light" | "dark" | "high-contrast";
type Density = "compact" | "comfortable";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // "error" makes violations fail the Storybook test run instead of quietly
      // rendering a warning badge nobody reads.
      test: "error",
      config: {
        rules: [{ id: "region", enabled: false }],
      },
    },
    options: {
      storySort: {
        order: ["Introduction", "Foundations", "Components"],
      },
    },
  },

  globalTypes: {
    direction: {
      description: "Text direction",
      defaultValue: "ltr",
      toolbar: {
        icon: "globe",
        items: [
          { value: "ltr", title: "Left to right" },
          { value: "rtl", title: "Right to left" },
        ],
        dynamicTitle: true,
      },
    },
    scheme: {
      description: "Color scheme",
      defaultValue: "light",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
          { value: "high-contrast", title: "High contrast" },
        ],
        dynamicTitle: true,
      },
    },
    density: {
      description: "Density",
      defaultValue: "comfortable",
      toolbar: {
        icon: "sliders",
        items: [
          { value: "compact", title: "Compact" },
          { value: "comfortable", title: "Comfortable" },
        ],
        dynamicTitle: true,
      },
    },
  },

  decorators: [
    /*
     * Wraps every story in the library's theming and direction contract.
     *
     * `dir` goes on a DOM node rather than being provided through React context,
     * which mirrors how the library actually resolves direction. A context-based
     * harness would let a component pass RTL tests while still being broken for
     * real RTL pages.
     *
     * The scheme goes on `<html>`, not on this wrapper. Auto dark mode is declared as
     * `:root:not([data-uir-scheme])`, so it is decided at the document root; pinning
     * `light` on a descendant cannot undo values already inherited from `:root`. A
     * harness that set the attribute here would silently render every story in the
     * OS scheme, which is exactly the bug this comment exists to prevent. See
     * `docs/theming.md`.
     */
    (Story, context) => {
      const direction = (context.globals.direction ?? "ltr") as Direction;
      const scheme = (context.globals.scheme ?? "light") as Scheme;
      const density = (context.globals.density ?? "comfortable") as Density;

      applyGlobals(scheme, density);

      return (
        <div
          dir={direction}
          style={{
            minHeight: "100%",
            padding: "2rem",
            background: "var(--uir-background)",
            color: "var(--uir-text)",
            fontFamily: "var(--uir-font-family)",
          }}
        >
          <Story />
        </div>
      );
    },
  ],
};

export default preview;

/**
 * Set the scheme and density on the document root.
 *
 * Matches how an application themes itself (`<html data-uir-scheme="dark">`), which is
 * the only place the auto-dark rule can be overridden.
 *
 * A Storybook decorator is a plain function returning an element, not a React
 * component, so this is not a write-during-render in the sense `src/internal` bans. It
 * is still applied on every decorator call so the toolbar always wins over a stale
 * value from the previous story.
 */
function applyGlobals(scheme: Scheme, density: Density): void {
  const root = document.documentElement;
  root.setAttribute("data-uir-scheme", scheme);
  root.setAttribute("data-uir-density", density);
}
