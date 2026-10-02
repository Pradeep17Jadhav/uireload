/**
 * Switch stories.
 *
 * A switch is a setting, not a command, so the stories that matter are about *when* it
 * takes effect and what it is for: an immediately-applied setting, a disabled one, a
 * read-only one showing a value the user cannot change. The toolbar covers RTL, dark,
 * high-contrast and density.
 */

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Switch } from "uireload/components/switch";

const meta = {
  title: "Components/Switch",
  component: Switch,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    tone: { control: "inline-radio", options: ["neutral", "accent", "positive", "danger"] },
    labelPosition: { control: "inline-radio", options: ["end", "start"] },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    checked: {
      description: "Controlled state. Leave unset for uncontrolled.",
    },
    defaultChecked: {
      description: "Initial state when uncontrolled.",
    },
  },
  args: {
    id: "wifi",
    label: "Wi-Fi",
    size: "md",
    tone: "neutral",
    labelPosition: "end",
    disabled: false,
    required: false,
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default. A visible label is not optional in practice: `role="switch"` with
 * `aria-checked` says what the control is, but never what it is for, so an unnamed switch
 * is announced only as "switch, on". Omitting the label logs a development warning.
 */
export const Default: Story = {};

/** Controlled: the consumer owns the state and decides when to apply it. */
export const Controlled: Story = {
  args: {
    checked: true,
    onCheckedChange: () => undefined,
  },
};

/** Uncontrolled: the component owns the state after `defaultChecked`. */
export const Unchecked: Story = {
  args: {
    checked: undefined,
    defaultChecked: false,
  },
};

/** Every size. Size is a `data-*` attribute, so CSS owns the actual styling. */
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)" }}>
      {(["sm", "md", "lg"] as const).map((size) => (
        <Switch {...args} key={size} size={size} id={`wifi-${size}`} label={`Size ${size}`} />
      ))}
    </div>
  ),
};

/** Every tone. A tone is the colour of the track when on; there is no `variant` axis. */
export const Tones: Story = {
  args: { checked: undefined, defaultChecked: true },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)" }}>
      {(["neutral", "accent", "positive", "danger"] as const).map((tone) => (
        <Switch {...args} key={tone} tone={tone} id={`tone-${tone}`} label={`Tone ${tone}`} />
      ))}
    </div>
  ),
};

/**
 * `labelPosition="start"` puts the label before the control, for layouts that read
 * top-to-bottom. It is a logical direction, so it mirrors in RTL with no extra rule.
 */
export const LabelBefore: Story = {
  args: { labelPosition: "start", label: "Enable notifications" },
};

/**
 * Controlled and declined.
 *
 * `Switch` has no `readOnly` prop, and this is the supported way to show a setting the user may
 * read but not change: control `checked`, call `onCheckedChange`, and do nothing when you do not
 * want the change to stick. See `README.md` for why the prop is absent.
 */
export const ControlledAndDeclined: Story = {
  render: function Render() {
    const [checked] = useState(false);

    return (
      <Switch
        id="managed"
        label="Managed by your organisation"
        checked={checked}
        onCheckedChange={() => {
          // Refuse the change by leaving state alone.
        }}
      />
    );
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultChecked: true,
    label: "Available on the enterprise plan",
  },
};

/** Required adds the word "Required" to the label for assistive technology, not just an asterisk. */
export const Required: Story = {
  args: { required: true, label: "I accept the terms" },
};

/**
 * A switch needs no `variant`, and the reason is worth seeing.
 *
 * A switch is a setting, not a command, so the emphasis ladder — which describes how loud
 * an *action* is — has no meaning here. A "ghost" switch would be invisible and a "solid"
 * one is what every switch already is.
 */
export const ToneIsTheOnlyAxis: Story = {
  args: { checked: undefined, defaultChecked: true },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)" }}>
      <Switch {...args} id="neutral" label="Neutral" tone="neutral" />
      <Switch {...args} id="accent" label="Accent" tone="accent" />
    </div>
  ),
};

/**
 * A realistic group. The label is the point of every one of these, which is why a switch
 * with only an `aria-label` is a fallback rather than the recommendation.
 */
export const SettingsGroup: Story = {
  args: { checked: undefined },
  render: () => (
    <fieldset
      style={{ border: 0, display: "grid", gap: "var(--uir-space)", margin: 0, padding: 0 }}
    >
      <Switch id="wifi" label="Wi-Fi" defaultChecked />
      <Switch id="bluetooth" label="Bluetooth" />
      <Switch id="roaming" label="Data roaming" size="sm" />
      <Switch id="hotspot" label="Personal hotspot" defaultChecked />
      <Switch id="airplane" label="Airplane mode" tone="danger" size="sm" />
    </fieldset>
  ),
};

/**
 * Force a high-contrast / RTL check. The toolbar already covers both, but a dedicated story
 * means a screenshot review can include them without depending on toolbar state.
 */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  args: {
    id: "rtl",
    label: "تفعيل الإشعارات",
    defaultChecked: true,
    labelPosition: "start",
  },
};
