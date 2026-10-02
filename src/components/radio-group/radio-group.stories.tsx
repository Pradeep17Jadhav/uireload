/**
 * Radio group stories.
 *
 * The states that matter are selection-related rather than visual: nothing selected, one selected,
 * a disabled option in the middle of the list, and the two directions.
 */

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { RadioGroup } from "uireload/components/radio-group";

const CONTACT = [
  { value: "sms", label: "Text message" },
  { value: "email", label: "Email" },
  { value: "push", label: "Push notification" },
];

const meta = {
  title: "Components/RadioGroup",
  component: RadioGroup,
  parameters: {
    layout: "fullWidth",
  },
  argTypes: {
    orientation: { control: "inline-radio", options: ["vertical", "horizontal"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    tone: { control: "inline-radio", options: ["neutral", "accent", "positive", "danger"] },
    clearable: { control: "boolean" },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
  },
  args: {
    id: "contact",
    label: "How should we contact you?",
    options: CONTACT,
    orientation: "vertical",
    size: "md",
    tone: "neutral",
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default.
 *
 * A `<fieldset>` of real `<input type="radio">`, so form submission and the platform's own radio
 * grouping work without us reimplementing them.
 */
export const Default: Story = {};

/**
 * With an answer already chosen.
 *
 * Note the single tab stop: Tab lands on the *selected* option, not the first, so returning to the
 * group puts the user where they left off rather than at the top.
 */
export const WithSelection: Story = {
  args: { defaultValue: "email" },
};

/** Nothing selected. The tab stop sits on the first selectable option. */
export const NothingSelected: Story = {};

/**
 * Disabled options in the middle and at the end.
 *
 * Skipped by the arrow keys *and* by `Home`/`End` — which is what makes a group usable with a
 * keyboard rather than merely visible.
 */
export const WithDisabledOptions: Story = {
  args: {
    options: [
      { value: "sms", label: "Text message" },
      { value: "email", label: "Email", disabled: true },
      { value: "push", label: "Push notification" },
      { value: "post", label: "Post", disabled: true },
    ],
    defaultValue: "sms",
  },
};

/** Side by side. `orientation` also drives the styling, not only the documented axis. */
export const Horizontal: Story = {
  args: { orientation: "horizontal" },
};

/**
 * Clearable.
 *
 * Opt-in rather than the default: making it the default would let a keyboard user empty a required
 * field by pressing the answer they already chose.
 */
export const Clearable: Story = {
  args: { clearable: true, defaultValue: "email", label: "Optional — clear me" },
};

/** The whole group disabled. `opacity` only, so a tooltip can still explain why. */
export const Disabled: Story = {
  args: { disabled: true, defaultValue: "email" },
};

/** Required. The asterisk is `aria-hidden`; the hidden word is what gets announced. */
export const Required: Story = {
  args: { required: true },
};

/** Every intent. The unselected dots are deliberately tone-neutral; see the README. */
export const Tones: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      {(["neutral", "accent", "positive", "danger"] as const).map((tone) => (
        <RadioGroup
          key={tone}
          {...args}
          id={`tone-${tone}`}
          tone={tone}
          label={tone}
          options={CONTACT.slice(0, 2)}
        />
      ))}
    </div>
  ),
};

/** Every size. `sm` is the dense size and is the minimum that still meets the target-size floor. */
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
      {(["sm", "md", "lg"] as const).map((size) => (
        <RadioGroup key={size} {...args} id={`size-${size}`} size={size} label={`Size ${size}`} />
      ))}
    </div>
  ),
};

/** An option carrying a secondary line, which is the reason `children` exists on an option. */
export const WithOptionDetail: Story = {
  args: {
    options: [
      { value: "fast", label: "Standard", children: "Arrives in about a week" },
      { value: "slow", label: "Express", children: "Arrives tomorrow, costs more" },
    ],
    defaultValue: "fast",
  },
};

/** With an announced description, wired to `aria-describedby` on the fieldset. */
export const WithHelperText: Story = {
  args: { helperText: "We use this only for delivery updates." },
};

/** Controlled, with the value shown, which is the pattern a form actually uses. */
export const Controlled: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<string | null>("email");

    return (
      <div style={{ maxWidth: "24rem", padding: "2rem" }}>
        <RadioGroup {...args} value={value} onValueChange={setValue} />
        <p style={{ color: "var(--uir-text-muted)", marginTop: "var(--uir-space)" }}>
          Selected: <code>{value ?? "none"}</code>
        </p>
      </div>
    );
  },
};

/**
 * The keyboard contract, demonstrated.
 *
 * Focus starts on the selected option; `ArrowDown` / `ArrowUp` move selection and focus together,
 * `Home` / `End` jump to the ends, and `Tab` leaves the group in one press rather than three.
 */
export const KeyboardContract: Story = {
  args: { defaultValue: "sms", label: "Tab in, arrow around, Tab out" },
};

/** RTL and high contrast. */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  args: { label: "كيف نتواصل معك؟", defaultValue: "email" },
};
