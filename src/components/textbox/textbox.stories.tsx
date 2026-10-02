/**
 * Textbox stories.
 *
 * A form field's states are mostly about the label, the description and the validation
 * message, so the stories here are about those combinations rather than about prop
 * permutations. The toolbar already covers RTL, dark, high-contrast and density.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { Textbox } from "uireload/components/textbox";

/*
 * `layout: "fullWidth"`, not `"padded"`, so a field is the full width of the canvas and
 * a `fullWidth` story is visually distinct from a shrink-to-fit one.
 */
const meta = {
  title: "Components/Textbox",
  component: Textbox,
  parameters: {
    layout: "fullWidth",
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    variant: { control: "inline-radio", options: ["ghost", "outline", "solid"] },
    tone: { control: "inline-radio", options: ["neutral", "accent", "positive", "danger"] },
    type: {
      control: "inline-radio",
      options: ["text", "email", "number", "password", "search", "tel", "url"],
    },
    invalid: { control: "boolean" },
    disabled: { control: "boolean" },
    readOnly: { control: "boolean" },
    required: { control: "boolean" },
    fullWidth: { control: "boolean" },
    multiline: { control: "boolean" },
    value: {
      description: "Controlled value. Leave unset for uncontrolled.",
    },
    defaultValue: {
      description: "Initial value when uncontrolled.",
    },
  },
  args: {
    id: "full-name",
    label: "Full name",
    size: "md",
    variant: "outline",
    tone: "neutral",
    type: "text",
    invalid: false,
    disabled: false,
    readOnly: false,
    required: false,
    fullWidth: false,
    multiline: false,
  },
} satisfies Meta<typeof Textbox>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default. An `id` is always passed, because it is what binds the visible label to
 * the field and the description to its announcement. Omitting it logs a development
 * warning on purpose.
 */
export const Default: Story = {};

/** Controlled: the consumer owns the value and decides what to do with each keystroke. */
export const Controlled: Story = {
  args: {
    value: "Ada Lovelace",
    onValueChange: () => undefined,
  },
};

/** Uncontrolled: the component owns the value after `defaultValue`. */
export const WithDefaultValue: Story = {
  args: {
    value: undefined,
    defaultValue: "Grace Hopper",
  },
};

/**
 * With a description. The description is announced through `aria-describedby`, not merely
 * rendered next to the field, which is the difference a screen-reader user notices.
 */
export const WithHelperText: Story = {
  args: {
    id: "email",
    label: "Email address",
    helperText: "We only use this to send your receipt.",
  },
};

/**
 * Invalid. The message is the non-colour signal, so an invalid field without one is a
 * field that only communicates through hue.
 */
export const Invalid: Story = {
  args: {
    id: "email-invalid",
    label: "Email address",
    helperText: "Enter an address in the form name@example.com",
    invalid: true,
    defaultValue: "ada@",
  },
};

/**
 * `invalid` overrides `tone`. A field that has been told it is valid and is then found
 * to be wrong must not still read as a confirmation.
 */
export const InvalidOverridesTone: Story = {
  args: {
    id: "code-invalid",
    label: "Confirmation code",
    helperText: "That code has expired.",
    tone: "positive",
    invalid: true,
    defaultValue: "000000",
  },
};

/** A read-only field is still a field: focusable, selectable, and submitted. */
export const ReadOnly: Story = {
  args: {
    id: "order",
    label: "Order number",
    helperText: "Issued when the order was placed.",
    readOnly: true,
    defaultValue: "ORD-2026-0042",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Cannot be edited",
  },
};

/** Required adds the word "Required" to the label for assistive technology, not just an asterisk. */
export const Required: Story = {
  args: {
    id: "email-required",
    label: "Email address",
    type: "email",
    required: true,
    helperText: "We send the confirmation here.",
  },
};

/**
 * A multiline field grows with `rows` and keeps the browser's resize grip, so its height
 * is not something only JavaScript can set.
 */
export const Multiline: Story = {
  args: {
    id: "bio",
    label: "Short bio",
    multiline: true,
    rows: 4,
    fullWidth: true,
    helperText: "A sentence or two is plenty.",
  },
};

/** Every size. Size is a `data-*` attribute, so CSS owns the actual styling. */
export const Sizes: Story = {
  args: { value: undefined },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)" }}>
      {(["sm", "md", "lg"] as const).map((size) => (
        <Textbox
          {...args}
          key={size}
          size={size}
          id={`name-${size}`}
          label={`Size ${size}`}
          helperText="The label, the value and the description all scale together."
        />
      ))}
    </div>
  ),
};

/** Every emphasis, on the shared ladder rather than a Material-specific one. */
export const Variants: Story = {
  args: { value: undefined },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)" }}>
      {(["ghost", "outline", "solid"] as const).map((variant) => (
        <Textbox
          {...args}
          key={variant}
          variant={variant}
          id={`variant-${variant}`}
          label={`Variant ${variant}`}
        />
      ))}
    </div>
  ),
};

/**
 * An advisory tone. A field whose value is merely unusual is not invalid, which is
 * exactly the distinction a `valueState` draws.
 */
export const AdvisoryTones: Story = {
  args: { value: undefined },
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)" }}>
      <Textbox
        {...args}
        id="tone-positive"
        label="Positive"
        tone="positive"
        helperText="Available."
      />
      <Textbox
        {...args}
        id="tone-accent"
        label="Accent"
        tone="accent"
        helperText="This one is still in beta."
      />
    </div>
  ),
};

/**
 * Adornments. Both wrappers are `aria-hidden`, so an icon beside a field never becomes
 * part of its accessible name and never adds a tab stop.
 */
export const WithAdornments: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "var(--uir-space)" }}>
      <Textbox
        id="amount"
        label="Amount"
        type="number"
        startAdornment={<span aria-hidden="true">$</span>}
        helperText="A fixed fee, in US dollars."
      />
      <Textbox
        id="search"
        label="Search"
        type="search"
        endAdornment={<span aria-hidden="true">⌘K</span>}
        placeholder="Filter orders"
      />
    </div>
  ),
};

/** `fullWidth` is the only layout-affecting prop, matching every other control. */
export const FullWidth: Story = {
  args: { fullWidth: true, helperText: "Fills the containing block." },
};

/**
 * A field with no visible label, named with `aria-label`.
 *
 * Legal, and the right choice for a search box inside a labelled region. It is also the
 * easiest way to lose the name, so it gets a story of its own.
 */
export const AriaLabelledOnly: Story = {
  args: {
    id: "filter",
    label: undefined,
    "aria-label": "Filter results",
    placeholder: "Type to filter",
  },
};

/**
 * Force a high-contrast / RTL check. The toolbar already covers both, but a dedicated
 * story means a screenshot review can include them without depending on toolbar state.
 */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  args: {
    id: "rtl-name",
    label: "الاسم الكامل",
    helperText: "كما هو مذكور في وثيقتك الرسمية.",
    required: true,
    invalid: true,
    defaultValue: "آ",
  },
};
