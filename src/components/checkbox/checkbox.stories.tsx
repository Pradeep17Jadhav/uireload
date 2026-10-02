/**
 * Checkbox stories.
 *
 * The states that matter are the three positions — unchecked, checked, indeterminate — because
 * "indeterminate" is the one a consumer reaches for and cannot reason about from the docs alone.
 */

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Checkbox } from "uireload/components/checkbox";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "fullWidth",
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    tone: { control: "inline-radio", options: ["neutral", "accent", "positive", "danger"] },
    labelPosition: { control: "inline-radio", options: ["start", "end"] },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    indeterminate: {
      control: "boolean",
      description:
        "Never reachable by interaction. A click always resolves to checked or unchecked; the consumer owns this state.",
    },
    checked: { description: "Controlled state. Leave unset for uncontrolled." },
    defaultChecked: { description: "Initial state when uncontrolled." },
  },
  args: {
    id: "terms",
    label: "Email me about new releases",
    size: "md",
    tone: "neutral",
    labelPosition: "end",
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default.
 *
 * A real `<input type="checkbox">` underneath, so form participation, the Space key and the tab
 * order are the platform's rather than ours.
 */
export const Default: Story = {};

/** Every position, side by side. This is the story the component exists for. */
export const States: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      <Checkbox {...args} id="s1" label="Unchecked" />
      <Checkbox {...args} id="s2" label="Checked" defaultChecked />
      <Checkbox {...args} id="s3" label="Indeterminate" indeterminate />
      {/*
        Checked *and* indeterminate: the documented ordering rule says this still paints as
        partially checked, and that is what the DOM shows.
      */}
      <Checkbox {...args} id="s4" label="Checked and indeterminate" defaultChecked indeterminate />
    </div>
  ),
};

/**
 * A parent checkbox driving its children.
 *
 * The canonical use of indeterminate, and the reason it is a prop rather than a click result: the
 * parent derives "some" from its children, which no interaction can express.
 */
export const ParentAndChildren: Story = {
  render: function Render() {
    const [children, setChildren] = useState(["a", "c"]);
    const options = [
      { value: "a", label: "Weekly" },
      { value: "b", label: "Monthly" },
      { value: "c", label: "Release notes" },
    ];

    const checked = options.filter((option) => children.includes(option.value));
    const all = checked.length === options.length;
    const some = checked.length > 0 && !all;

    return (
      <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
        <Checkbox
          id="all"
          label="All of them"
          checked={all}
          indeterminate={some}
          onCheckedChange={(next) => setChildren(next ? options.map((o) => o.value) : [])}
        />

        <fieldset style={{ border: 0, margin: 0, padding: "0 0 0 1.5rem" }}>
          <legend className="uir-visually-hidden">Individual notifications</legend>
          {options.map((option) => (
            <div key={option.value} style={{ marginBlockEnd: "var(--uir-space-sm, 0.25rem)" }}>
              <Checkbox
                id={option.value}
                label={option.label}
                checked={children.includes(option.value)}
                onCheckedChange={(next) =>
                  setChildren((current) =>
                    next
                      ? [...current, option.value]
                      : current.filter((value) => value !== option.value)
                  )
                }
              />
            </div>
          ))}
        </fieldset>
      </div>
    );
  },
};

/** Every intent. The off state is deliberately tone-neutral; see the README. */
export const Tones: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      {(["neutral", "accent", "positive", "danger"] as const).map((tone) => (
        <div key={tone} style={{ display: "flex", gap: "var(--uir-space)" }}>
          <Checkbox {...args} id={`t-${tone}-off`} label={`${tone} — off`} tone={tone} />
          <Checkbox
            {...args}
            id={`t-${tone}-on`}
            label={`${tone} — on`}
            tone={tone}
            defaultChecked
          />
          <Checkbox
            {...args}
            id={`t-${tone}-mix`}
            label={`${tone} — mixed`}
            tone={tone}
            indeterminate
          />
        </div>
      ))}
    </div>
  ),
};

/** Every size. `sm` is the dense size and is the minimum that still meets the target-size floor. */
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      {(["sm", "md", "lg"] as const).map((size) => (
        <Checkbox key={size} {...args} id={`size-${size}`} size={size} label={`Size ${size}`} />
      ))}
    </div>
  ),
};

/** Label before the box. The DOM order does not change, so the accessible name is identical. */
export const LabelBefore: Story = {
  args: { labelPosition: "start" },
};

/** With an announced description, wired to `aria-describedby`. */
export const WithHelperText: Story = {
  render: (args) => (
    <div style={{ maxWidth: "24rem", padding: "2rem" }}>
      <Checkbox {...args} helperText="At most one email a week. Unsubscribe at any time." />
    </div>
  ),
};

/**
 * Disabled.
 *
 * Opacity only, with `pointer-events` intact: a disabled control is exactly the one a user needs a
 * tooltip to explain.
 */
export const Disabled: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      <Checkbox {...args} id="d1" label="Unchecked" disabled />
      <Checkbox {...args} id="d2" label="Checked" disabled defaultChecked />
      <Checkbox {...args} id="d3" label="Indeterminate" disabled indeterminate />
    </div>
  ),
};

/** Required. The asterisk is `aria-hidden`; the hidden word is what gets announced. */
export const Required: Story = {
  args: { required: true },
};

/** Controlled, with the value shown, which is the pattern a form actually uses. */
export const Controlled: Story = {
  render: function Render(args) {
    const [checked, setChecked] = useState(true);

    return (
      <div style={{ maxWidth: "24rem", padding: "2rem" }}>
        <Checkbox {...args} checked={checked} onCheckedChange={setChecked} />
        <p style={{ color: "var(--uir-text-muted)", marginTop: "var(--uir-space)" }}>
          Subscribed: <code>{checked ? "yes" : "no"}</code>
        </p>
      </div>
    );
  },
};

/** RTL and high contrast. */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  args: { label: "اشترك في النشرات" },
  render: (args) => (
    <div style={{ padding: "2rem" }}>
      <Checkbox {...args} id="rtl" indeterminate />
    </div>
  ),
};
