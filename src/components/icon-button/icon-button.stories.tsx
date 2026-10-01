/**
 * IconButton stories.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { IconButton } from "uireload/components/icon-button";

function Glyph({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={d} stroke="currentColor" strokeWidth="1.75" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const TRASH = "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6";
const PLUS = "M12 5v14M5 12h14";

const meta = {
  title: "Components/IconButton",
  component: IconButton,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["ghost", "outline", "solid"],
    },
    tone: { control: "inline-radio", options: ["neutral", "accent", "positive", "danger"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    disabled: { control: "boolean" },
    loading: { control: "boolean" },
    edge: { control: "inline-radio", options: [false, "start", "end"] },
  },
  args: {
    // Required: an icon-only control has no visible label, so `aria-label` is the
    // accessible name. There is no `label` prop that could be forgotten.
    "aria-label": "Add item",
    variant: "ghost",
    tone: "neutral",
    size: "md",
    disabled: false,
    loading: false,
    edge: false,
    children: <Glyph d={PLUS} />,
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--uir-control-gap)" }}>
      <IconButton {...args} variant="ghost">
        <Glyph d={PLUS} />
      </IconButton>
      <IconButton {...args} variant="outline">
        <Glyph d={PLUS} />
      </IconButton>
      <IconButton {...args} variant="solid">
        <Glyph d={PLUS} />
      </IconButton>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--uir-control-gap)", alignItems: "center" }}>
      <IconButton {...args} size="sm">
        <Glyph d={PLUS} />
      </IconButton>
      <IconButton {...args} size="md">
        <Glyph d={PLUS} />
      </IconButton>
      <IconButton {...args} size="lg">
        <Glyph d={PLUS} />
      </IconButton>
    </div>
  ),
};

/**
 * A toolbar, which is the reason `edge` exists: the control's padding is removed on
 * the inline-start edge and the negative margin pulls it flush, so the icon lines up
 * with the content beside it.
 */
export const InToolbar: Story = {
  render: (args) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--uir-control-gap)",
        borderBlockEnd: "var(--uir-control-border-width) solid var(--uir-border)",
        paddingBlockEnd: "var(--uir-space)",
        paddingInlineStart: "0",
      }}
    >
      <IconButton {...args} edge="start" aria-label="Add">
        <Glyph d={PLUS} />
      </IconButton>
      <IconButton {...args} edge="end" aria-label="Delete" tone="danger">
        <Glyph d={TRASH} />
      </IconButton>
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Loading: Story = {
  args: { loading: true },
};
