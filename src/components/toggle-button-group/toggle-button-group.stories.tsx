/**
 * ToggleButtonGroup stories.
 *
 * The two selection modes look identical and behave completely differently: one is
 * a radiogroup with roving focus, the other is a group of independently-tabbable
 * pressed buttons. The stories are named to make that difference obvious.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { ToggleButton } from "uireload/components/toggle-button";
import { ToggleButtonGroup } from "uireload/components/toggle-button-group";

const ITEMS = [
  { value: "grid", label: "Grid" },
  { value: "list", label: "List" },
  { value: "map", label: "Map" },
];

/*
 * The members are written once here rather than extracted into a `<Members />` component.
 *
 * ToggleButtonGroup rebuilds each child to attach selection and roving focus, so it needs
 * each child's `value` prop directly. A component that *returns* the buttons hides that
 * prop one level deeper, and the group collapses them into a single empty button. The
 * group now logs an error for that case; this story previously tripped it.
 */
const members = ITEMS.map((item) => (
  <ToggleButton key={item.value} value={item.value}>
    {item.label}
  </ToggleButton>
));

const meta = {
  title: "Components/ToggleButtonGroup",
  component: ToggleButtonGroup,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    selectionMode: {
      control: "inline-radio",
      options: ["single", "multiple"],
      description:
        "Single renders role=radiogroup with roving tabindex and selection following focus. Multiple renders role=group with each member its own tab stop.",
    },
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    variant: { control: "inline-radio", options: ["ghost", "outline", "solid"] },
    tone: { control: "inline-radio", options: ["neutral", "accent", "positive", "danger"] },
    disabled: { control: "boolean" },
    label: { control: "text" },
  },
  args: {
    label: "View",
    selectionMode: "single",
    orientation: "horizontal",
    size: "md",
    variant: "outline",
    tone: "neutral",
    disabled: false,
  },
} satisfies Meta<typeof ToggleButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Single selection. Rendered as `role="radiogroup"`, so the whole control is one tab
 * stop and the arrow keys move both focus and selection.
 */
export const SingleSelection: Story = {
  args: { defaultValue: "list" },
  render: (args) => <ToggleButtonGroup {...args}>{members}</ToggleButtonGroup>,
};

/**
 * Multiple selection. Rendered as `role="group"` with `aria-pressed` members, so each
 * one is its own tab stop and only Space or Enter toggles it.
 */
export const MultipleSelection: Story = {
  args: { selectionMode: "multiple", defaultValue: ["grid"] },
  render: (args) => <ToggleButtonGroup {...args}>{members}</ToggleButtonGroup>,
};

/** A vertical group responds to Up/Down rather than Left/Right. */
export const Vertical: Story = {
  args: { orientation: "vertical", defaultValue: "grid" },
  render: (args) => <ToggleButtonGroup {...args}>{members}</ToggleButtonGroup>,
};

/** The group owns size, variant and tone; members inherit them. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "var(--uir-space)" }}>
      {(["sm", "md", "lg"] as const).map((size) => (
        <ToggleButtonGroup key={size} label={`Size ${size}`} size={size} defaultValue="grid">
          {members}
        </ToggleButtonGroup>
      ))}
    </div>
  ),
};

/**
 * With a visible label. `aria-labelledby` is the better choice when the group already has
 * a visible heading, and it is why `label` is optional.
 */
export const LabelledByVisibleText: Story = {
  render: () => (
    <div>
      <p id="view-label" style={{ marginBlockEnd: "var(--uir-space)" }}>
        Choose a view
      </p>
      {/*
        `selectionMode` is written explicitly, not spread. A spread that leaves it as
        `"single" | "multiple" | undefined` resolves to the multiple-selection branch of
        the discriminated union, whose `defaultValue` is `string[]` — so the single
        branch becomes unreachable at the type level.
      */}
      <ToggleButtonGroup
        selectionMode="single"
        label={undefined}
        aria-labelledby="view-label"
        defaultValue="grid"
      >
        {members}
      </ToggleButtonGroup>
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "grid" },
  render: (args) => <ToggleButtonGroup {...args}>{members}</ToggleButtonGroup>,
};
