/**
 * Template story.
 *
 * Copy this file to `src/components/<your-component>/<name>.stories.tsx` and rename
 * every occurrence of `example`.
 *
 * This is scaffolding, not a product component. The `_` prefix keeps the folder out
 * of the build, the stylesheet bundle and the export map, so it never ships. It exists
 * so a new component has a working story to copy rather than one to invent.
 *
 * Two conventions this file demonstrates:
 *
 * 1. A story imports its own stylesheet. Library component CSS is assembled into
 *    `uireload/styles.css` at build time and must not be imported from JavaScript, so
 *    Storybook has no way to pick it up otherwise.
 * 2. A story per meaningful state, not per prop combination. Use the toolbar for RTL,
 *    dark, high-contrast and density: those are the axes every component has to
 *    survive, and a global decorator applies them to every story at once.
 *
 * This template uses a relative import, which a real component must NOT. Stories for
 * published components import through the package specifier
 * (`uireload/components/<name>`), so a broken export map fails here rather than at
 * publish time. The template cannot do that, because the `_` prefix keeps it out of the
 * export map. Change this line when you copy the folder.
 * 2. A story per meaningful state, not per prop combination. Use the toolbar for RTL,
 *    dark, high-contrast and density: those are the axes every component has to
 *    survive, and a global decorator applies them to every story at once.
 */

import type { Meta, StoryObj } from "@storybook/react";

import "./example.css";

import { Example } from "./example";

const meta = {
  title: "Template/Example",
  component: Example,
  parameters: {
    // Layout wrapper, since this template does not control its own box.
    layout: "centered",
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: ["sm", "md", "lg"],
    },
    open: {
      control: "boolean",
      description: "Controlled open state. Leave unset for uncontrolled.",
    },
    defaultOpen: {
      control: "boolean",
      description: "Initial state when uncontrolled.",
    },
    disabled: {
      control: "boolean",
    },
  },
  args: {
    children: "Template component",
    size: "md",
    disabled: false,
  },
} satisfies Meta<typeof Example>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Stories are written as render functions rather than arg tables wherever the state
 * needs to be visible. The toolbar covers RTL, scheme and density; the stories cover
 * the states that are specific to this component.
 */

export const Default: Story = {};

/** Controlled: the consumer owns the state and decides what to do with it. */
export const Controlled: Story = {
  args: {
    defaultOpen: undefined,
    open: false,
  },
};

/** Uncontrolled: the component owns the state after `defaultOpen`. */
export const UncontrolledOpen: Story = {
  args: {
    open: undefined,
    defaultOpen: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

/** Every size. Size is a `data-*` attribute, so CSS owns the actual styling. */
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)" }}>
      <Example {...args} size="sm">
        small
      </Example>
      <Example {...args} size="md">
        medium
      </Example>
      <Example {...args} size="lg">
        large
      </Example>
    </div>
  ),
};

/**
 * Force a high-contrast / RTL check.
 *
 * The toolbar already covers both, but a dedicated story means a screenshot review
 * can include it without depending on remembering the toolbar state.
 */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  args: {
    defaultOpen: true,
  },
};
