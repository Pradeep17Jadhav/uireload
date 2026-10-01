/**
 * Automated accessibility checks.
 *
 * The definition of done requires axe to report zero violations for every component.
 * The Storybook a11y addon is configured to fail on violations
 * (`test: "error"` in `.storybook/preview.tsx`), but that only runs when someone
 * opens Storybook. These tests make it part of `npm test`, so an accessibility
 * regression fails CI rather than a review.
 *
 * axe is a **dev** dependency. Nothing here ships.
 */

import { render } from "@testing-library/react";
import axe, { type AxeResults, type ElementContext, type RunOptions } from "axe-core";
import { expect, describe, it } from "vitest";

import { renderWithProviders } from "./helpers";

/**
 * axe options.
 *
 * The default rule set is used unchanged. What is relaxed are the rules that report
 * structural problems with a *fragment* of a page rather than with the component:
 *
 * - `region`: every landmark must be inside a landmark. A component rendered on its
 *   own is not inside one, and that is correct.
 * - `page-has-heading-one` / `landmark-one-main`: page-structure rules, out of scope
 *   for a single widget.
 *
 * Nothing about contrast, name, role or keyboard is relaxed. Those are the ones that
 * matter and they run at their strictest.
 */
const AXE_OPTIONS: RunOptions = {
  rules: {
    region: { enabled: false },
    "page-has-heading-one": { enabled: false },
    "landmark-one-main": { enabled: false },
  },
};

/** Run axe against the rendered container and return the violations. */
async function analyse(container: ElementContext): Promise<AxeResults> {
  return axe.run(container, AXE_OPTIONS);
}

/** Assert no violations, with a readable message when there are some. */
async function expectNoViolations(container: ElementContext): Promise<void> {
  const { violations } = await analyse(container);

  const summary = violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.help}\n  ` +
      violation.nodes.map((node) => node.target.join(" ")).join("\n  ")
  );

  expect(summary.join("\n\n")).toBe("");
}

describe("Button", () => {
  it("has no accessibility violations", async () => {
    const { Button } = await import("uireload/components/button");

    const { container } = render(
      <Button startIcon={<span />} variant="solid" tone="accent">
        Save
      </Button>
    );

    await expectNoViolations(container);
  });

  it("has no violations when disabled or loading", async () => {
    const { Button } = await import("uireload/components/button");

    const { container } = render(
      <>
        <Button disabled>Save</Button>
        <Button loading>Save</Button>
      </>
    );

    await expectNoViolations(container);
  });
});

describe("IconButton", () => {
  it("has no accessibility violations", async () => {
    const { IconButton } = await import("uireload/components/icon-button");

    const { container } = render(
      <IconButton aria-label="Delete">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16" />
        </svg>
      </IconButton>
    );

    await expectNoViolations(container);
  });
});

describe("ToggleButton", () => {
  it("has no accessibility violations", async () => {
    const { ToggleButton } = await import("uireload/components/toggle-button");

    const { container } = render(<ToggleButton defaultPressed>Bold</ToggleButton>);

    await expectNoViolations(container);
  });
});

describe("ToggleButtonGroup", () => {
  it("has no violations as a single-selection radiogroup", async () => {
    const { ToggleButton } = await import("uireload/components/toggle-button");
    const { ToggleButtonGroup } = await import("uireload/components/toggle-button-group");

    const { container } = render(
      <ToggleButtonGroup label="View" defaultValue="grid">
        <ToggleButton value="grid">Grid</ToggleButton>
        <ToggleButton value="list">List</ToggleButton>
      </ToggleButtonGroup>
    );

    await expectNoViolations(container);
  });

  it("has no violations as a multiple-selection group", async () => {
    const { ToggleButton } = await import("uireload/components/toggle-button");
    const { ToggleButtonGroup } = await import("uireload/components/toggle-button-group");

    const { container } = render(
      <ToggleButtonGroup label="Filters" selectionMode="multiple">
        <ToggleButton value="grid">Grid</ToggleButton>
        <ToggleButton value="list">List</ToggleButton>
      </ToggleButtonGroup>
    );

    await expectNoViolations(container);
  });

  it("has no violations when labelled by a visible element", async () => {
    const { ToggleButton } = await import("uireload/components/toggle-button");
    const { ToggleButtonGroup } = await import("uireload/components/toggle-button-group");

    const { container } = render(
      <div>
        <p id="view-label">Choose a view</p>
        <ToggleButtonGroup aria-labelledby="view-label" defaultValue="grid">
          <ToggleButton value="grid">Grid</ToggleButton>
        </ToggleButtonGroup>
      </div>
    );

    await expectNoViolations(container);
  });
});

describe("colour schemes", () => {
  it("has no violations in any scheme", async () => {
    const { Button } = await import("uireload/components/button");

    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      const { container, unmount } = renderWithProviders(
        <Button variant="solid" tone="danger" fullWidth>
          Delete
        </Button>,
        { scheme }
      );

      await expectNoViolations(container);
      unmount();
    }
  });
});

describe("axe itself", () => {
  it("is wired up, not silently passing", async () => {
    // A test that cannot fail proves nothing. This renders a genuine violation — an
    // unlabelled text input, which axe reports as a critical `label` violation — and asserts axe reports it, so a broken configuration
    // (wrong container, disabled rules, bad import) shows up as a failure rather than
    // as permanent green.
    const { container } = render(<input type="text" />);

    const { violations } = await analyse(container);

    expect(violations.length).toBeGreaterThan(0);
  });
});
