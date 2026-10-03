/**
 * Loader stories.
 *
 * The states that matter are the two forms — determinate and indeterminate — because they are the same
 * role with a different set of attributes, and the difference is invisible on screen until you know to
 * look for it. Every state worth checking has a story here.
 */

import { useEffect, useState, type ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Loader } from "uireload/components/loader";

const meta = {
  title: "Components/Loader",
  component: Loader,
  parameters: { layout: "padded" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    tone: { control: "inline-radio", options: ["neutral", "accent", "positive", "danger"] },
    value: { control: { type: "number", min: 0, max: 100, step: 5 } },
    max: { control: { type: "number", min: 1, max: 1000 } },
    showValue: { control: "boolean" },
    label: { control: "text" },
    valueLabel: { control: "text" },
  },
  args: { value: 40, size: "md", tone: "accent", showValue: true },
} satisfies Meta<typeof Loader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The frame every composed story below shares, so the bars are all the same width and directly comparable. */
const Frame = ({ children }: { children: ReactNode }) => (
  <div style={{ display: "grid", gap: "var(--uir-space-lg)", maxWidth: "36rem" }}>{children}</div>
);

/** The attribute set a screen reader would be told, printed out. */
const Annotated = ({ children }: { children: ReactNode }) => (
  <code style={{ color: "var(--uir-text-muted)", fontSize: "0.8125rem" }}>{children}</code>
);

/**
 * Determinate, at 40%.
 *
 * A real `progressbar` carrying `aria-valuenow`, `aria-valuemin` and `aria-valuemax`. The number is shown
 * because `showValue` is on; it is never shown by default, because the bar already says it.
 */
export const Default: Story = {};

/**
 * Indeterminate — no `value` at all.
 *
 * **The same role, with all three value attributes absent.** That omission is what "we do not know" looks
 * like in ARIA. A bar pinned at zero would claim the work has not started, which is a different claim.
 */
export const Indeterminate: Story = {
  args: { value: undefined, showValue: false },
};

/**
 * The two forms together, with their attribute sets printed underneath.
 *
 * The clearest possible statement of the design: same element, same role, and the entire difference is
 * whether `aria-valuenow` is there.
 */
export const DeterminateVersusIndeterminate: Story = {
  render: (args) => (
    <Frame>
      <Loader {...args} value={40} />
      <Annotated>
        role=&quot;progressbar&quot; aria-valuenow=&quot;40&quot; aria-valuemin=&quot;0&quot;
        aria-valuemax=&quot;100&quot;
      </Annotated>
      <Loader {...args} value={undefined} showValue={false} />
      <Annotated>
        role=&quot;progressbar&quot; &mdash; no aria-valuenow, because the value is unknown
      </Annotated>
    </Frame>
  ),
};

/**
 * Advancing on its own.
 *
 * Driven by an interval rather than by a slider, because the common case is a fetch whose rate you do not
 * control. It is also the clearest demonstration that the indeterminate form is a real state and not a
 * fallback: watch it reach 100% and stop.
 */
export const Advancing: Story = {
  render: (args) => <AdvancingLoader {...args} label="Uploading your files" />,
};

function AdvancingLoader({ label, ...props }: React.ComponentProps<typeof Loader>) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setValue((current) => Math.min(100, current + 4));
    }, 300);
    return () => clearInterval(timer);
  }, []);

  return <Loader {...props} label={label} value={value} valueLabel={`File 3 of 7 - uploading`} />;
}

/**
 * With a `valueLabel`.
 *
 * `aria-valuetext` carries "Step 2 of 7 — verifying", so a screen reader hears where the work is rather
 * than just how much. A percentage says **how much**, never **what**.
 */
export const WithValueLabel: Story = {
  args: { value: 28, valueLabel: "Step 2 of 7 - verifying your email" },
};

/** A fraction of something other than 100, so `max` has a reason to exist. */
export const CustomMax: Story = {
  args: { value: 3, max: 12, label: "Uploading", valueLabel: "File 3 of 12" },
};

/** Out of range in both directions, clamped before the value is announced. */
export const OutOfRange: Story = {
  render: (args) => (
    <Frame>
      <Loader {...args} value={140} />
      <Loader {...args} value={-20} />
    </Frame>
  ),
};

/** Every size. The bar's height is the bar's height, whatever the text beside it does. */
export const Sizes: Story = {
  render: (args) => (
    <Frame>
      {(["sm", "md", "lg"] as const).map((size) => (
        <Loader key={size} {...args} size={size} />
      ))}
    </Frame>
  ),
};

/** Every tone. `positive` is for work that is genuinely succeeding, not for "it is loading". */
export const Tones: Story = {
  render: (args) => (
    <Frame>
      {(["neutral", "accent", "positive", "danger"] as const).map((tone) => (
        <Loader key={tone} {...args} tone={tone} />
      ))}
    </Frame>
  ),
};

/** A caption under the bar, which is what `children` is for. */
export const WithCaption: Story = {
  args: { value: 66 },
  render: (args) => (
    <Loader {...args}>
      <span style={{ color: "var(--uir-text-muted)", fontSize: "0.875rem" }}>
        66% &mdash; 2 of 3 steps complete. This can take a few minutes.
      </span>
    </Loader>
  ),
};

/**
 * Both forms together, which is what a real page does.
 *
 * A page-level indeterminate bar while the request is in flight, and a determinate one for the upload that
 * happens afterwards. Having both on screen at once is the clearest argument for two components rather
 * than one with a flag.
 */
export const BothForms: Story = {
  render: (args) => (
    <Frame>
      <div style={{ display: "grid", gap: "0.5rem" }}>
        <Loader {...args} value={undefined} showValue={false} label="Connecting" />
        <span style={{ color: "var(--uir-text-muted)", fontSize: "0.875rem" }}>
          Connecting to the server&hellip;
        </span>
      </div>
      <div style={{ display: "grid", gap: "0.5rem" }}>
        <Loader {...args} value={72} label="Uploading" valueLabel="Uploading file 5 of 7" />
        <span style={{ color: "var(--uir-text-muted)", fontSize: "0.875rem" }}>
          Uploading your archive&hellip;
        </span>
      </div>
    </Frame>
  ),
};

/** RTL and high contrast. The fill grows from the inline start, so it mirrors with no second rule. */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  render: (args) => (
    <Frame>
      <Loader {...args} value={40} label="جارٍ تحميل المشاريع" />
      <Loader {...args} value={undefined} showValue={false} label="جارٍ الاتصال بالخادم" />
      <Loader {...args} value={88} tone="positive" />
    </Frame>
  ),
};
