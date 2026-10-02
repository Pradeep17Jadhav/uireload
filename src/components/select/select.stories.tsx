/**
 * Select stories.
 *
 * A select's states are about *how the user finds a value* — by browsing, by typing, by being
 * stopped from choosing — so the stories here are those situations rather than prop permutations.
 */

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "uireload/components/button";
import { Select, type SelectItem } from "uireload/components/select";
import { Switch } from "uireload/components/switch";

const CITIES: SelectItem[] = [
  { value: "ams", label: "Amsterdam" },
  { value: "ber", label: "Berlin" },
  { value: "cph", label: "Copenhagen" },
  { value: "dub", label: "Dublin" },
  { value: "edi", label: "Edinburgh" },
  { value: "hel", label: "Helsinki", disabled: true },
  { value: "lis", label: "Lisbon" },
];

const TIMEZONES: SelectItem[] = [
  { value: "draft", label: "Draft" },
  { value: "review", label: "In review" },
  { value: "scheduled", label: "Scheduled" },
  {
    group: true,
    label: "Archived",
    options: [
      { value: "wip", label: "Work in progress" },
      { value: "dropped", label: "Dropped" },
    ],
  },
];

const meta = {
  title: "Components/Select",
  component: Select,
  parameters: {
    layout: "fullWidth",
  },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    variant: { control: "inline-radio", options: ["ghost", "outline", "solid"] },
    tone: { control: "inline-radio", options: ["neutral", "accent", "positive", "danger"] },
    invalid: { control: "boolean" },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    fullWidth: { control: "boolean" },
    closeOnOutsidePress: { control: "boolean" },
    closeOnSelect: {
      control: "boolean",
      description: "Turn off to build a multi-select on top of this.",
    },
    typeahead: {
      control: "boolean",
      description:
        "The only way to change the value from the keyboard without opening the list. Typing commits; arrows browse.",
    },
    options: { control: false },
  },
  args: {
    options: CITIES,
    label: "Deployment region",
    size: "md",
    variant: "outline",
    tone: "neutral",
    fullWidth: false,
  },
} satisfies Meta<typeof Select>;

export default meta;

/*
 * Typed against `meta` rather than bare `StoryObj`, so the shared `args` above are merged in.
 * Without this, Storybook treats `options` — which is required — as unsatisfied in every story that
 * only spreads `args`, because nothing connects the meta-level args to the story-level render.
 */
type Story = StoryObj<typeof meta>;

/**
 * The default.
 *
 * Opening highlights the selected option, so the listbox's position matches what the trigger shows.
 * With nothing selected the first option is highlighted instead — a listbox with no tab stop is
 * not navigable at all.
 */
export const Default: Story = {
  render: function Render(args) {
    const [region, setRegion] = useState("ams");

    return (
      <div style={{ maxWidth: "24rem", padding: "2rem" }}>
        <Select {...args} value={region} onChange={setRegion} />
        <p style={{ color: "var(--uir-text-muted)", marginTop: "var(--uir-space)" }}>
          Selected: <code>{region}</code>
        </p>
      </div>
    );
  },
};

/**
 * Grouped options.
 *
 * A group is `role="group"` with a name, which is the APG grouping rather than a nested listbox —
 * a nested listbox would make each group its own composite widget. The heading is
 * `aria-hidden`, because the group's `aria-label` already announces it and a visible heading that is
 * also announced says it twice.
 */
export const WithGroups: Story = {
  args: { options: TIMEZONES, label: "Workflow state" },
  render: function Render(args) {
    const [state, setState] = useState("review");

    return (
      <div style={{ maxWidth: "24rem", padding: "2rem" }}>
        <Select {...args} value={state} onChange={setState} />
      </div>
    );
  },
};

/**
 * Disabled options.
 *
 * `CITIES` has `Helsinki` disabled. It is skipped by *every* path — click, arrows, `Home`/`End` and
 * typeahead — not merely greyed out. A list that stops at a disabled entry is unusable with a
 * keyboard, which is precisely when the list is most useful.
 */
export const WithDisabledOptions: Story = {
  args: {
    options: CITIES,
    label: "Deployment region",
    helperText: "Helsinki is at capacity and cannot be selected.",
  },
  render: function Render(args) {
    const [region, setRegion] = useState("ber");

    return (
      <div style={{ maxWidth: "24rem", padding: "2rem" }}>
        <Select {...args} value={region} onChange={setRegion} />
      </div>
    );
  },
};

/**
 * Invalid, with a description that is actually announced.
 *
 * `helperText` is wired to `aria-describedby`, so the explanation reaches a screen reader rather
 * than only being rendered. `invalid` also paints the control in the `danger` role set whatever
 * `tone` says, which is why a validation failure cannot be described with a token that means
 * "advisory".
 */
export const Invalid: Story = {
  args: {
    invalid: true,
    helperText: "Choose a region before deploying.",
    tone: "accent",
    defaultValue: "",
  },
  render: (args) => (
    <div style={{ maxWidth: "24rem", padding: "2rem" }}>
      <Select {...args} />
    </div>
  ),
};

/**
 * Required.
 *
 * The asterisk is `aria-hidden` and the word "Required" is visually hidden, so the requirement is
 * announced rather than drawn. MUI renders the marker from a CSS `::after`, which no screen reader
 * can see.
 */
export const Required: Story = {
  args: { required: true, helperText: "Used for billing." },
  render: (args) => (
    <div style={{ maxWidth: "24rem", padding: "2rem" }}>
      <Select {...args} />
    </div>
  ),
};

/** Every size. Size changes the control's metrics, and nothing about its behaviour. */
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", maxWidth: "24rem", padding: "2rem" }}>
      {(["sm", "md", "lg"] as const).map((size) => (
        <Select
          key={size}
          {...args}
          size={size}
          label={`Region (${size})`}
          id={`size-${size}`}
          defaultValue="cph"
        />
      ))}
    </div>
  ),
};

/** Every emphasis and every intent, as the shared control ladder. */
export const VariantsAndTones: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", maxWidth: "24rem", padding: "2rem" }}>
      {(["ghost", "outline", "solid"] as const).map((variant) =>
        (["neutral", "accent", "positive", "danger"] as const).map((tone, index) => (
          <Select
            key={`${variant}-${tone}`}
            {...args}
            variant={variant}
            tone={tone}
            label={`${variant} / ${tone}`}
            id={`${variant}-${tone}-${index}`}
            defaultValue="lis"
          />
        ))
      )}
    </div>
  ),
};

/**
 * Disabled.
 *
 * The native `disabled` attribute, so the trigger is out of the tab order and does not open. The
 * opacity is the only visual change and `pointer-events` is deliberately left intact: MUI's
 * `pointer-events: none` makes the control unclickable to a tooltip, and with it the explanation of
 * why it is disabled.
 */
export const Disabled: Story = {
  args: { disabled: true, helperText: "Managed by your organisation." },
  render: (args) => (
    <div style={{ maxWidth: "24rem", padding: "2rem" }}>
      <Select {...args} />
    </div>
  ),
};

/**
 * Inside a form, which is where the hidden input earns its place.
 *
 * The trigger is a `<button>`, and a button submits nothing. The hidden `<input name>` carries the
 * value to the server — UI5's `@formProperty` and MUI's `name`, reached through the one element the
 * platform offers.
 */
export const InAForm: Story = {
  args: { name: "region", defaultValue: "dub", label: "Region", required: true },
  render: (args) => (
    <form style={{ display: "grid", gap: "var(--uir-space)", maxWidth: "24rem", padding: "2rem" }}>
      <Select {...args} />
      <div style={{ display: "flex", gap: "var(--uir-space)" }}>
        <Button variant="ghost" type="reset">
          Reset
        </Button>
        <Button variant="solid" type="submit">
          Deploy
        </Button>
      </div>
    </form>
  ),
};

/**
 * Typeahead.
 *
 * The keyboard's fast path, and the *only* way to change the value without opening the list: the
 * APG listbox pattern makes an arrow key open the listbox, so browsing never commits. Typing
 * commits. Set `typeahead={false}` to see the cost of that — the value becomes unreachable without
 * opening and dismissing a popup.
 */
export const Typeahead: Story = {
  args: { defaultValue: "ams" },
  render: function Render(args) {
    const [region, setRegion] = useState("ams");

    return (
      <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem" }}>
        <p style={{ margin: 0 }}>
          Focus the control and type a letter. Repeated letters cycle through the options starting
          with it.
        </p>
        <div style={{ maxWidth: "24rem" }}>
          <Select {...args} value={region} onChange={setRegion} />
        </div>
      </div>
    );
  },
};

/**
 * Options with rich content.
 *
 * `label` is what names the option; `children` is rendered after it and is decorative unless
 * `textValue` says what to announce. A label containing an image otherwise produces an accessible
 * name of nothing useful.
 */
export const RichOptionContent: Story = {
  args: {
    label: "Version",
    options: [
      {
        value: "1.0.0",
        label: "1.0.0",
        children: "stable",
      },
      {
        value: "2.0.0-rc.1",
        label: "2.0.0-rc.1",
        children: "release candidate",
      },
      {
        value: "2.1.0",
        label: "2.1.0",
        children: "latest",
      },
    ],
    defaultValue: "2.1.0",
  },
  render: (args) => (
    <div style={{ maxWidth: "24rem", padding: "2rem" }}>
      <Select {...args} />
    </div>
  ),
};

/**
 * A select with a live summary, which is the pattern that actually needs a dropdown — the label
 * alone would force the user to remember what each value meant.
 */
export const WithASummary: Story = {
  args: { label: "Deployment region", options: CITIES, id: "summary-region" },
  render: function Render(args) {
    const [region, setRegion] = useState("ams");

    return (
      <div style={{ maxWidth: "24rem", padding: "2rem" }}>
        <Select {...args} value={region} onChange={setRegion} />
        <p
          id="summary-region-hint"
          style={{ color: "var(--uir-text-muted)", marginTop: "var(--uir-space)" }}
        >
          Deploys to <strong>{region.toUpperCase()}</strong>.
        </p>
        <Switch
          id="summary-nightly"
          label="Also deploy nightly builds"
          defaultChecked
          style={{ marginTop: "var(--uir-space)" }}
        />
      </div>
    );
  },
};

/**
 * RTL and high contrast.
 *
 * `dir="rtl"` here rather than via the toolbar, because a dropdown's popover positioning is the
 * thing most likely to be wrong in RTL and it deserves a story that always shows it. The listbox
 * inherits direction from the document, not from the Select.
 */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  args: { options: CITIES, defaultValue: "ber", label: "منطقة النشر" },
  render: (args) => (
    <div style={{ maxWidth: "24rem", padding: "2rem" }}>
      <Select {...args} />
    </div>
  ),
};
