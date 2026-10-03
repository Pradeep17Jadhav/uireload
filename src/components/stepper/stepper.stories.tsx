/**
 * Stepper stories.
 *
 * The states that matter are the two navigation modes, because they decide which steps exist as
 * *buttons* — and therefore what the strip's tab stops are.
 */

import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Stepper, type StepperStep } from "uireload/components/stepper";

const STEPS: StepperStep[] = [
  { id: "account", label: "Account" },
  { id: "profile", label: "Profile", description: "Name and photo" },
  { id: "billing", label: "Billing", description: "Card and invoices" },
  { id: "review", label: "Review" },
];

const meta = {
  title: "Components/Stepper",
  component: Stepper,
  parameters: { layout: "fullWidth" },
  argTypes: {
    navigation: { control: "inline-radio", options: ["linear", "non-linear"] },
    orientation: { control: "inline-radio", options: ["horizontal", "vertical"] },
    announcePosition: { control: "boolean" },
    showContent: { control: "boolean" },
    disabled: { control: "boolean" },
    active: { control: { type: "number", min: 0, max: 10 } },
  },
  args: {
    steps: STEPS,
    active: 2,
    navigation: "linear",
    orientation: "horizontal",
    announcePosition: true,
    showContent: false,
    disabled: false,
  },
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Linear, the default.
 *
 * The steps **behind** the current one are buttons — going back is allowed, because a wizard you
 * cannot return to in order to fix the address you typed two steps ago is a wizard people abandon.
 * The steps ahead are plain text, because arriving there is the wizard's decision rather than the
 * user's. So the strip's tab stops are exactly the steps a user can move to.
 */
export const Default: Story = {
  render: function Render(args) {
    const [active, setActive] = useState(args.active ?? 2);

    return (
      <div style={{ padding: "2rem" }}>
        <Stepper {...args} active={active} onStepChange={setActive} />
        <p style={{ color: "var(--uir-text-muted)", marginBlockStart: "var(--uir-space)" }}>
          Try it with a keyboard: Tab lands on step 1, then step 2, then moves past the strip. The
          upcoming steps are not tab stops, because they are not controls.
        </p>
      </div>
    );
  },
};

/**
 * Non-linear.
 *
 * Every step the user has not reached is a button, forward ones included. Right when nothing before
 * the current step has to be filled in first.
 */
export const NonLinear: Story = {
  args: { navigation: "non-linear" },
  render: function Render(args) {
    const [active, setActive] = useState(args.active ?? 2);

    return (
      <div style={{ padding: "2rem" }}>
        <Stepper {...args} active={active} onStepChange={setActive} />
      </div>
    );
  },
};

/** Vertical, where the connector runs down between markers rather than across. */
export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: function Render(args) {
    const [active, setActive] = useState(1);

    return (
      <div style={{ padding: "2rem" }}>
        <Stepper {...args} active={active} onStepChange={setActive} />
      </div>
    );
  },
};

/**
 * Every state, in one strip.
 *
 * Completed, current and upcoming side by side, with an optional step and a locked one — the
 * combination that shows whether the states are still distinguishable once a tone is involved.
 */
export const WithOptionalAndError: Story = {
  args: {
    steps: [
      { id: "a", label: "Account" },
      { id: "b", label: "Profile", description: "Name and photo" },
      { id: "c", label: "Billing", description: "Optional for free plans", optional: true },
      {
        id: "d",
        label: "Review",
        tone: "danger",
        errorText: "Card number is invalid",
      },
    ],
    active: 3,
  },
  render: (args) => (
    <div style={{ padding: "2rem" }}>
      <Stepper {...args} />
    </div>
  ),
};

/**
 * A step in an error state.
 *
 * `aria-describedby` points at the error text on an actionable step. A step in an error state that a
 * screen reader cannot hear about is an error a screen reader user cannot fix, which is the one
 * failure a wizard cannot afford.
 */
export const ErrorState: Story = {
  args: {
    steps: [
      { id: "a", label: "Account" },
      { id: "b", label: "Profile" },
      {
        id: "c",
        label: "Billing",
        tone: "danger",
        errorText: "Card number is invalid — check the digits and try again.",
      },
      { id: "d", label: "Review" },
    ],
    active: 2,
    navigation: "non-linear",
  },
  render: (args) => (
    <div style={{ padding: "2rem" }}>
      <Stepper {...args} />
    </div>
  ),
};

/** A locked step: a `<div>`, not a disabled button, so Tab skips it and nothing claims "unavailable". */
export const LockedStep: Story = {
  args: {
    steps: [
      { id: "a", label: "Account" },
      { id: "b", label: "Identity check", description: "Locked until billing is set" },
      { id: "c", label: "Billing" },
      { id: "d", label: "Review" },
    ],
    active: 0,
    navigation: "non-linear",
  },
  render: (args) => (
    <div style={{ padding: "2rem" }}>
      <Stepper {...args} />
    </div>
  ),
};

/**
 * With content.
 *
 * `showContent` puts the step's body under the strip, which is the shape a single-page wizard uses.
 */
export const WithContent: Story = {
  args: { showContent: true },
  render: function Render(args) {
    const [active, setActive] = useState(1);

    return (
      <div style={{ padding: "2rem" }}>
        <Stepper {...args} active={active} onStepChange={setActive}>
          <p style={{ margin: 0, maxWidth: "32rem" }}>
            {active === 0
              ? "Create an account to get started. You can change any of this later."
              : active === 1
                ? "Tell us who you are. Only a display name is required."
                : active === 2
                  ? "A card is needed for paid plans. Free plans can skip this."
                  : "Check everything over before you create the project."}
          </p>
        </Stepper>
      </div>
    );
  },
};

/**
 * Disabled.
 *
 * A flag, not a `disabled` attribute on the headers: a disabled attribute would remove every step from
 * the tab order and leave a keyboard user with no way to read the wizard's structure at all, which is
 * the one thing a disabled form should never do.
 */
export const Disabled: Story = {
  args: { disabled: true, active: 2 },
  render: (args) => (
    <div style={{ padding: "2rem", opacity: 0.999 }}>
      <Stepper {...args} />
    </div>
  ),
};

/** A one-step stepper, which is how a wizard's last screen still shows its header. */
export const SingleStep: Story = {
  args: { steps: [{ id: "only", label: "Done" }], active: 0 },
  render: (args) => (
    <div style={{ padding: "2rem" }}>
      <Stepper {...args} />
    </div>
  ),
};

/** No steps, which renders the strip and the status region and nothing in between. */
export const NoSteps: Story = {
  args: { steps: [], active: 0 },
  render: (args) => (
    <div style={{ padding: "2rem" }}>
      <Stepper {...args} />
    </div>
  ),
};

/** Without the status region, for a consumer that announces the step itself. */
export const WithoutAnnouncement: Story = {
  args: { announcePosition: false },
  render: (args) => (
    <div style={{ padding: "2rem" }}>
      <Stepper {...args} />
    </div>
  ),
};

/** RTL and high contrast, both orientations. */
export const HighContrastRtl: Story = {
  globals: { scheme: "high-contrast", direction: "rtl" },
  render: (args) => (
    <div style={{ display: "grid", gap: "3rem", padding: "2rem" }}>
      {(["horizontal", "vertical"] as const).map((orientation) => (
        <Stepper
          key={orientation}
          {...args}
          orientation={orientation}
          active={2}
          navigation="non-linear"
          steps={[
            { id: "a", label: "الحساب" },
            { id: "b", label: "الملف الشخصي" },
            { id: "c", label: "الفوترة" },
            { id: "d", label: "المراجعة" },
          ]}
        />
      ))}
    </div>
  ),
};
