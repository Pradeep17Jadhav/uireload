/**
 * Tab bar stories.
 *
 * The states that matter are the two activation modes, because that is the decision the whole
 * component turns on: arrows moving focus only, or arrows moving the selection too.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { Text } from "uireload/components/text";
import { TabBar, type TabItem } from "uireload/components/tab-bar";

const SECTIONS: TabItem[] = [
  { value: "overview", label: "Overview", panel: "What changed in this release." },
  {
    value: "activity",
    label: "Activity",
    badge: "12",
    panel: "Recent runs, with their status and duration.",
  },
  {
    value: "errors",
    label: "Errors",
    badge: "3",
    tone: "danger",
    panel: "Three failures in the last hour.",
  },
  { value: "settings", label: "Settings", panel: "Everything you can change." },
];

const meta = {
  title: "Components/TabBar",
  component: TabBar,
  parameters: {
    layout: "fullWidth",
  },
  argTypes: {
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] },
    activation: {
      control: "inline-radio",
      options: ["automatic", "automatic-activation", "manual"],
    },
    indicatorPosition: {
      control: "inline-radio",
      options: ["auto", "block-end", "block-start", "inline-end"],
    },
    lazy: { control: "boolean" },
    scrollable: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    label: "Project sections",
    items: SECTIONS,
    orientation: "horizontal",
    activation: "automatic",
    indicatorPosition: "auto",
    lazy: false,
    scrollable: true,
  },
} satisfies Meta<typeof TabBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default.
 *
 * `role="tablist"` with a real `<button role="tab">` per tab, a roving tabindex so the strip is one
 * Tab stop, and each panel associated in both directions.
 */
export const Default: Story = {};

/**
 * Manual activation.
 *
 * Arrow keys move focus; Enter or Space moves the selection. This is the default on a horizontal bar
 * because automatic activation means arrowing past four tabs fires four requests, and on a tab set that
 * is not wrapped in a router it destroys the form data on the tab the user left.
 *
 * Tab twice, arrow across, then press Enter — the selection follows the focus only when you ask.
 */
export const ManualActivation: Story = {
  args: { activation: "manual" },
};

/**
 * Automatic activation.
 *
 * Arrowing changes the selection as it changes the focus. Right for a strip whose panels are cheap and
 * independent — a settings sidebar, a filter bar — and wrong for one whose panels are expensive.
 */
export const AutomaticActivation: Story = {
  args: { activation: "automatic-activation" },
};

/**
 * Vertical.
 *
 * `automatic` resolves to *activation* on a vertical bar, because a vertical strip is a listbox: there
 * the arrows do what Enter does on a horizontal one.
 */
export const Vertical: Story = {
  args: { orientation: "vertical" },
};

/** A per-tab tone, which is why tone is not a bar-wide prop. */
export const Tones: Story = {
  render: (args) => (
    <div style={{ padding: "2rem" }}>
      <TabBar
        {...args}
        items={[
          { value: "a", label: "Normal", tone: "neutral", panel: "Neutral." },
          { value: "b", label: "Synced", tone: "positive", panel: "Positive." },
          { value: "c", label: "Errors", tone: "danger", badge: "3", panel: "Danger." },
          { value: "d", label: "Busy", tone: "accent", panel: "Accent." },
        ]}
      />
    </div>
  ),
};

/** A disabled tab stays rendered and visible, and is skipped by the arrows. */
export const WithDisabledTab: Story = {
  render: (args) => (
    <div style={{ padding: "2rem" }}>
      <TabBar
        {...args}
        items={[
          { value: "a", label: "Available", panel: "Reachable." },
          { value: "b", label: "Coming soon", disabled: true, panel: "Unreachable." },
          { value: "c", label: "Also available", panel: "Reachable." },
        ]}
      />
    </div>
  ),
};

/**
 * The indicator on another edge.
 *
 * `auto` puts it on the edge the tabs advance toward, which is `block-end` on a horizontal bar and
 * `inline-end` on a vertical one.
 */
export const IndicatorPositions: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      {(["auto", "block-end", "block-start", "inline-end"] as const).map((indicatorPosition) => (
        <div key={indicatorPosition}>
          <Text variant="h4" gutterBottom>
            {indicatorPosition}
          </Text>
          <TabBar {...args} indicatorPosition={indicatorPosition} />
        </div>
      ))}
    </div>
  ),
};

/**
 * Overflowing.
 *
 * The strip scrolls rather than wrapping, because a wrapping strip puts two tabs on one line and stops
 * being a strip, and a clipped one puts tabs out of reach where they are not discoverable.
 */
export const Overflowing: Story = {
  render: (args) => (
    <div style={{ padding: "2rem" }}>
      <TabBar
        {...args}
        items={Array.from({ length: 12 }, (_, i) => ({
          value: `s${i}`,
          label: `Section ${i + 1}`,
          panel: `Panel ${i + 1}`,
        }))}
      />
    </div>
  ),
};

/**
 * Lazy panels.
 *
 * Unmounting the unselected panels is cheaper and costs find-in-page, which is why it is opt-in. Turn
 * this on and search the page for text in a panel you are not looking at: it is gone.
 */
export const Lazy: Story = {
  args: { lazy: true },
};

/** Controlled, which is what a router-driven tab set needs. */
export const Controlled: Story = {
  render: function Render(args) {
    return (
      <div style={{ padding: "2rem" }}>
        <TabBar {...args} />
        <Text variant="h5" tone="muted">
          Every tab above keeps its panel mounted. Switch to the Lazy story to compare.
        </Text>
      </div>
    );
  },
};

/** Disabled. Every tab leaves the tab order. */
export const Disabled: Story = {
  args: { disabled: true },
};

/** RTL and high contrast. */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  render: (args) => (
    <div style={{ padding: "2rem" }}>
      <TabBar
        {...args}
        label="أقسام المشروع"
        items={[
          { value: "a", label: "نظرة عامة", panel: "ملخص." },
          { value: "b", label: "الأخطاء", badge: "٣", tone: "danger", panel: "ثلاثة أخطاء." },
          { value: "c", label: "الإعدادات", panel: "الإعدادات." },
        ]}
      />
    </div>
  ),
};
