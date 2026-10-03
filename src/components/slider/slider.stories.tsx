/**
 * Slider stories.
 *
 * The states that matter are the two-thumb range, the marks, and `orientation` — because those three
 * change the keyboard contract and the DOM, rather than only the appearance.
 */

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Slider, type SliderMark } from "uireload/components/slider";
import { Text } from "uireload/components/text";

const MARKS: SliderMark[] = [
  { value: 0, label: "0" },
  { value: 25, label: "25" },
  { value: 50, label: "50" },
  { value: 75, label: "75" },
  { value: 100, label: "100" },
];

const meta = {
  title: "Components/Slider",
  component: Slider,
  parameters: { layout: "fullWidth" },
  argTypes: {
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] },
    track: { control: "inline-radio", options: ["normal", "inverted"] },
    valueLabelDisplay: { control: "inline-radio", options: ["auto", "on", "off"] },
    tone: { control: "inline-radio", options: ["neutral", "accent", "positive", "danger"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    disabled: { control: "boolean" },
    showLabels: { control: "boolean" },
    snapToStep: { control: "boolean" },
    hideValueText: { control: "boolean" },
    min: { control: { type: "number" } },
    max: { control: { type: "number" } },
    step: { control: { type: "number" } },
  },
  args: {
    label: "Volume",
    orientation: "horizontal",
    track: "normal",
    valueLabelDisplay: "auto",
    tone: "neutral",
    size: "md",
    disabled: false,
    showLabels: false,
    min: 0,
    max: 100,
    step: 1,
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * One thumb.
 *
 * A real `<input type="range">`, so `ArrowLeft`/`Right`, `Home` and `End`, and the form participation
 * are the platform's. The component adds only what a native range input lacks: `PageUp`/`PageDown`,
 * `+`/`-` and `Escape`, plus the neighbour clamp.
 */
export const Default: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<number[]>([40]);

    return (
      <div style={{ padding: "2rem", maxWidth: "28rem" }}>
        <Slider {...args} value={value} onValueChange={setValue} />
      </div>
    );
  },
};

/**
 * Uncontrolled.
 *
 * `defaultValue` and no `value`. The component owns the state until a consumer needs to read it, at
 * which point `onValueChange` starts reporting without `value` taking over.
 */
export const Uncontrolled: Story = {
  args: { defaultValue: [65] },
};

/**
 * A range, from `value` length.
 *
 * Two values means two thumbs and two real inputs. There is no `thumbs` prop: the length of `value`
 * is the count, because a second source of truth for one fact is a prop every consumer has to keep in
 * step.
 */
export const Range: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<number[]>([25, 75]);

    return (
      <div style={{ padding: "2rem", maxWidth: "28rem" }}>
        <Slider {...args} label="Price range" value={value} onValueChange={setValue} />
        <Text tone="muted">
          The thumbs cannot cross: a range whose minimum is above its maximum renders fine and lies
          to everyone who submits it.
        </Text>
      </div>
    );
  },
};

/**
 * A collapsed range.
 *
 * Both thumbs at the same value. Duplicates are **kept** rather than deduplicated, because a collapsed
 * range is escapable — drag either thumb and it separates — whereas a component that refused to
 * render the state would leave the user stuck.
 */
export const Collapsed: Story = {
  args: { label: "Zero-width range", value: [50, 50], onValueChange: () => undefined },
};

/** With marks. The label under each mark is what makes a discrete scale readable. */
export const WithMarks: Story = {
  args: { marks: MARKS, showLabels: true, step: null, defaultValue: [50] },
};

/**
 * A discrete scale.
 *
 * `step={null}` with marks, so the value snaps to the marks rather than to an arbitrary number between
 * them.
 */
export const Discrete: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<number[]>([2]);

    return (
      <div style={{ padding: "2rem", maxWidth: "28rem" }}>
        <Slider
          {...args}
          getAriaValueText={(v) => ["Free", "Starter", "Team", "Business"][v] ?? String(v)}
          label="Plan"
          marks={[
            { value: 0, label: "Free" },
            { value: 1, label: "Starter" },
            { value: 2, label: "Team" },
            { value: 3, label: "Business" },
          ]}
          max={3}
          onValueChange={setValue}
          showLabels
          step={null}
          value={value}
        />
      </div>
    );
  },
};

/** Inverted: the fill is on the side the thumb is moving away from. */
export const Inverted: Story = {
  args: { track: "inverted", defaultValue: [40] },
};

/** Vertical. One real input, rotated — the keyboard contract is identical. */
export const Vertical: Story = {
  args: { orientation: "vertical", defaultValue: [40] },
  render: (args) => (
    <div style={{ display: "grid", placeItems: "center", blockSize: "16rem", padding: "2rem" }}>
      <Slider {...args} />
    </div>
  ),
};

/**
 * The value bubble.
 *
 * `valueLabelDisplay="auto"` shows it while focused or dragged and hides it otherwise, so it does not
 * become permanent furniture. `hideValueText` keeps the bubble but stops it from being the thumb's
 * accessible name — which is the case where the value is already announced by the marks.
 */
export const ValueLabel: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "2rem", padding: "2rem", maxWidth: "28rem" }}>
      {(["auto", "on", "off"] as const).map((valueLabelDisplay) => (
        <div key={valueLabelDisplay}>
          <Text overline>{valueLabelDisplay}</Text>
          <Slider
            defaultValue={[40]}
            hideValueText={valueLabelDisplay === "on"}
            label={`Value label: ${valueLabelDisplay}`}
            marks={MARKS}
            showLabels
            step={null}
            valueLabelDisplay={valueLabelDisplay}
          />
        </div>
      ))}
    </div>
  ),
};

/** With helper text, which is `aria-describedby`-ed rather than merely drawn. */
export const WithHelperText: Story = {
  args: {
    helperText: "Charged per seat, billed monthly.",
    marks: MARKS,
    showLabels: true,
    step: null,
    defaultValue: [50],
  },
};

/** Every tone. The tone is the fill, so it is a state rather than a decoration. */
export const Tones: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem", maxWidth: "28rem" }}>
      {(["neutral", "accent", "positive", "danger"] as const).map((tone) => (
        <Slider key={tone} {...args} defaultValue={[40]} label={`Volume (${tone})`} tone={tone} />
      ))}
    </div>
  ),
};

/** Every size. `size` changes the thumb and the track height, not the hit area. */
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--uir-space)", padding: "2rem", maxWidth: "28rem" }}>
      {(["sm", "md", "lg"] as const).map((size) => (
        <Slider key={size} {...args} defaultValue={[40]} label={`Volume (${size})`} size={size} />
      ))}
    </div>
  ),
};

/** Disabled. The value stays readable; only the interaction goes. */
export const Disabled: Story = {
  args: { disabled: true, defaultValue: [40], helperText: "Managed by your administrator." },
};

/** With a `name`, so it participates in a form as the platform's. */
export const InAForm: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<number[]>([40]);

    return (
      <form
        onSubmit={(event) => event.preventDefault()}
        style={{ display: "grid", gap: "var(--uir-space)", maxWidth: "28rem", padding: "2rem" }}
      >
        <Slider {...args} name="volume" value={value} onValueChange={setValue} />
        <button type="submit">Save</button>
      </form>
    );
  },
};

/** RTL and high contrast. The fill mirrors; the keyboard contract is identical. */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  render: (args) => (
    <div style={{ display: "grid", gap: "2rem", padding: "2rem", maxWidth: "28rem" }}>
      <Slider {...args} defaultValue={[40]} label="مستوى الصوت" tone="accent" />
      <Slider
        {...args}
        defaultValue={[20, 80]}
        label="نطاق السعر"
        marks={MARKS}
        showLabels
        step={null}
      />
      <Slider {...args} disabled defaultValue={[40]} label="معطّل" />
    </div>
  ),
};
