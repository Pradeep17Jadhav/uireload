/**
 * Chip stories.
 *
 * The states that matter are the three `intent` values, because that prop decides which element is
 * rendered — and therefore the role, the name and the number of tab stops.
 */

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Chip } from "uireload/components/chip";

const meta = {
  title: "Components/Chip",
  component: Chip,
  parameters: {
    layout: "fullWidth",
  },
  argTypes: {
    intent: { control: "inline-radio", options: ["none", "button", "remove"] },
    tone: { control: "inline-radio", options: ["neutral", "accent", "positive", "danger"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    variant: { control: "inline-radio", options: ["filled", "outlined"] },
    disabled: { control: "boolean" },
  },
  args: {
    children: "Weekly",
    intent: "none",
    tone: "neutral",
    size: "md",
    variant: "filled",
  },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default: a static label.
 *
 * A `<span>` with no role, not focusable, not actionable. Most chips are this, and a chip that is
 * focusable when it does nothing puts a tab stop on every item in a list.
 */
export const Default: Story = {};

/** An activatable chip. A real `<button type="button">`, so Space and Enter are the platform's. */
export const Activatable: Story = {
  args: { intent: "button" },
};

/**
 * A removable chip.
 *
 * A span holding a real button — not a button inside a button. Only the cross is focusable, and it is
 * one tab stop.
 */
export const Removable: Story = {
  args: { intent: "remove", onRemove: () => undefined },
};

/** Every intent side by side. This is the story the component exists for. */
export const Intents: Story = {
  render: (args) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--uir-space)", padding: "2rem" }}>
      <Chip {...args} intent="none" />
      <Chip {...args} intent="button" />
      <Chip {...args} intent="remove" onRemove={() => undefined} />
    </div>
  ),
};

/** Every intent, disabled. `opacity` only, so a tooltip can still explain why. */
export const Disabled: Story = {
  render: (args) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--uir-space)", padding: "2rem" }}>
      <Chip {...args} intent="none" disabled />
      <Chip {...args} intent="button" disabled />
      <Chip {...args} intent="remove" disabled onRemove={() => undefined} />
    </div>
  ),
};

/**
 * Every intent.
 *
 * A wash rather than a solid fill: a chip is a small object seen in a group, and a saturated fill per
 * chip turns a row of filters into a colour chart.
 */
export const Tones: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      {(["neutral", "accent", "positive", "danger"] as const).map((tone) => (
        <div key={tone} style={{ display: "flex", flexWrap: "wrap", gap: "var(--uir-space)" }}>
          <Chip {...args} tone={tone} intent="none" children={tone} />
          <Chip {...args} tone={tone} intent="button" children={tone} />
          <Chip {...args} tone={tone} intent="remove" children={tone} onRemove={() => undefined} />
        </div>
      ))}
    </div>
  ),
};

/**
 * Filled and outlined.
 *
 * Outlined is for a set where colour carries no information — otherwise the same information is drawn
 * twice, once as a fill and again as a border.
 */
export const Variants: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      {(["neutral", "accent", "positive", "danger"] as const).map((tone) => (
        <div key={tone} style={{ display: "flex", flexWrap: "wrap", gap: "var(--uir-space)" }}>
          <Chip {...args} tone={tone} variant="filled" children={`${tone} filled`} />
          <Chip {...args} tone={tone} variant="outlined" children={`${tone} outlined`} />
        </div>
      ))}
    </div>
  ),
};

/** Every size. `sm` is the dense size for a toolbar or a table cell. */
export const Sizes: Story = {
  render: (args) => (
    <div
      style={{ display: "flex", alignItems: "center", gap: "var(--uir-space)", padding: "2rem" }}
    >
      {(["sm", "md", "lg"] as const).map((size) => (
        <Chip key={size} {...args} size={size} children={`Size ${size}`} />
      ))}
    </div>
  ),
};

/** With a leading icon. The icon is `aria-hidden`; the chip's text is the name. */
export const WithIcon: Story = {
  render: (args) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--uir-space)", padding: "2rem" }}>
      {(["neutral", "accent", "positive", "danger"] as const).map((tone) => (
        <Chip key={tone} {...args} tone={tone}>
          <span style={{ display: "inline-block", fontSize: "0.9em" }} aria-hidden="true">
            ●
          </span>
          {tone}
        </Chip>
      ))}
    </div>
  ),
};

/** A row of filter chips, which is the most common use of an activatable chip. */
export const FilterRow: Story = {
  render: function Render() {
    const [active, setActive] = useState<string[]>(["weekly"]);

    return (
      <div style={{ padding: "2rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--uir-space)" }}>
          {[
            { id: "weekly", label: "Weekly" },
            { id: "monthly", label: "Monthly" },
            { id: "drafts", label: "Drafts" },
          ].map((filter) => {
            const on = active.includes(filter.id);
            return (
              <Chip
                key={filter.id}
                intent="button"
                tone={on ? "accent" : "neutral"}
                variant={on ? "filled" : "outlined"}
                aria-pressed={on}
                onClick={() =>
                  setActive((current) =>
                    on ? current.filter((id) => id !== filter.id) : [...current, filter.id]
                  )
                }
              >
                {filter.label}
              </Chip>
            );
          })}
        </div>
        <p style={{ color: "var(--uir-text-muted)", marginTop: "var(--uir-space)" }}>
          Selected: <code>{active.length === 0 ? "none" : active.join(", ")}</code>
        </p>
      </div>
    );
  },
};

/**
 * A removable list, which is the reason the chip does not remove itself.
 *
 * The consumer owns the list; the chip reports and stays. `removeLabel` is set for every entry,
 * because "Remove" alone in a list of six announces six identical buttons.
 */
export const RemovableList: Story = {
  render: function Render() {
    const [items, setItems] = useState(["Weekly digest", "Monthly summary", "Release notes"]);

    if (items.length === 0) {
      return (
        <p style={{ color: "var(--uir-text-muted)", padding: "2rem" }}>
          All removed. The list lives in the consumer, so the empty state is theirs too.
        </p>
      );
    }

    return (
      <ul
        style={{
          display: "grid",
          gap: "var(--uir-space)",
          listStyle: "none",
          margin: 0,
          padding: "2rem",
        }}
      >
        {items.map((item) => (
          <li key={item}>
            <Chip
              intent="remove"
              removeLabel={`Remove ${item}`}
              onRemove={() => setItems((current) => current.filter((x) => x !== item))}
            >
              {item}
            </Chip>
          </li>
        ))}
      </ul>
    );
  },
};

/** A long label, which truncates rather than wrapping. A two-line chip reads as a different component. */
export const LongLabel: Story = {
  args: { children: "A label far longer than the space available for it" },
  render: (args) => (
    <div style={{ maxWidth: "12rem", padding: "2rem" }}>
      <Chip {...args} />
    </div>
  ),
};

/** RTL and high contrast. */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  render: (args) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--uir-space)", padding: "2rem" }}>
      <Chip {...args} intent="none" tone="danger" children="حرج" />
      <Chip {...args} intent="button" tone="accent" children="نشط" />
      <Chip
        {...args}
        intent="remove"
        tone="neutral"
        removeLabel="إزالة أسبوعي"
        onRemove={() => undefined}
      >
        أسبوعي
      </Chip>
    </div>
  ),
};
