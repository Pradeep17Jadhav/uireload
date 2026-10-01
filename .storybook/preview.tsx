import type { Preview } from "@storybook/react";
import "../src/theme/tokens.css";
import "../src/index.css";

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
     */
    (Story, context) => {
      const direction = (context.globals.direction ?? "ltr") as Direction;
      const scheme = (context.globals.scheme ?? "light") as Scheme;
      const density = (context.globals.density ?? "comfortable") as Density;

      return (
        <div
          dir={direction}
          data-uir-scheme={scheme}
          data-uir-density={density}
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
