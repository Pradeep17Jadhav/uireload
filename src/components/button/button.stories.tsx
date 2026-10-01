/**
 * Button stories.
 *
 * One story per state that matters, not per prop combination. Direction, colour
 * scheme and density are the Storybook toolbar's job — `.storybook/preview.tsx`
 * applies them to every story in the library.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "uireload/components/button";

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["ghost", "outline", "solid"],
      description: "Emphasis. From `docs/foundations.md` section 3.",
    },
    tone: {
      control: "inline-radio",
      options: ["neutral", "accent", "positive", "danger"],
      description: "Intent, independent of emphasis. Section 4.",
    },
    size: {
      control: "inline-radio",
      options: ["sm", "md", "lg"],
      description: "Section 2.",
    },
    disabled: { control: "boolean" },
    loading: { control: "boolean" },
    fullWidth: { control: "boolean" },
  },
  args: {
    children: "Save",
    variant: "outline",
    tone: "neutral",
    size: "md",
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/**
 * The full emphasis ladder at one tone. Three `solid` buttons would mean three
 * primary actions on a screen, which is the mistake the ladder exists to prevent.
 */
export const Variants: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--uir-control-gap)", flexWrap: "wrap" }}>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="outline">
        Outline
      </Button>
      <Button {...args} variant="solid">
        Solid
      </Button>
    </div>
  ),
};

/** Every tone at every emphasis, so the two axes are visibly orthogonal. */
export const Tones: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-control-gap)" }}>
      {(["neutral", "accent", "positive", "danger"] as const).map((tone) => (
        <div key={tone} style={{ display: "flex", gap: "var(--uir-control-gap)" }}>
          <Button {...args} variant="ghost" tone={tone}>
            {tone}
          </Button>
          <Button {...args} variant="outline" tone={tone}>
            {tone}
          </Button>
          <Button {...args} variant="solid" tone={tone}>
            {tone}
          </Button>
        </div>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--uir-control-gap)", alignItems: "center" }}>
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
};

/** Uses a placeholder SVG; the library ships no icon component. */
function Glyph() {
  return (
    <svg viewBox="0 0 16 16" width="100%" height="100%" aria-hidden="true" focusable="false">
      <path d="M2 8h12M8 2v12" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export const WithIcons: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--uir-control-gap)" }}>
      <Button {...args} variant="outline" startIcon={<Glyph />}>
        Add
      </Button>
      <Button {...args} variant="solid" endIcon={<Glyph />}>
        Continue
      </Button>
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
};

/**
 * Loading. The label stays in the DOM, so the button keeps its width and its
 * accessible name; only the indicator appears.
 */
export const Loading: Story = {
  args: { loading: true },
};

export const FullWidth: Story = {
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <div style={{ padding: "2rem" }}>
      <Button {...args} variant="solid" tone="accent" fullWidth>
        Continue
      </Button>
    </div>
  ),
};

/**
 * Long labels truncate rather than wrapping. A two-line button breaks every row
 * alignment below it, so the control clips instead.
 */
export const LongLabel: Story = {
  args: {
    children: "Submit this application for review",
  },
  parameters: { layout: "centered" },
  render: (args) => (
    <div style={{ inlineSize: "12rem" }}>
      <Button {...args} variant="solid">
        {args.children}
      </Button>
    </div>
  ),
};
