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

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("Textbox", () => {
  it("has no accessibility violations with a label and description", async () => {
    const { Textbox } = await import("uireload/components/textbox");

    const { container } = render(
      <Textbox id="email" label="Email address" helperText="We never share it" />
    );

    await expectNoViolations(container);
  });

  it("has no violations when invalid, required, read-only or disabled", async () => {
    const { Textbox } = await import("uireload/components/textbox");

    const { container } = render(
      <>
        <Textbox id="a" label="Invalid" invalid helperText="Enter a valid address" required />
        <Textbox id="b" label="Read only" readOnly defaultValue="Ada" />
        <Textbox id="c" label="Disabled" disabled defaultValue="Ada" />
      </>
    );

    await expectNoViolations(container);
  });

  it("has no violations as a multiline field with adornments", async () => {
    const { Textbox } = await import("uireload/components/textbox");

    const { container } = render(
      <Textbox
        id="bio"
        label="Short bio"
        multiline
        rows={4}
        startAdornment={<span>$</span>}
        endAdornment={<span>USD</span>}
      />
    );

    await expectNoViolations(container);
  });

  it("has no violations when labelled only by aria-label", async () => {
    // A field with no visible label is legal when it has a name, and the name is the only
    // thing that keeps it out of axe's `label` rule.
    const { Textbox } = await import("uireload/components/textbox");

    const { container } = render(
      <Textbox id="filter" label={undefined} aria-label="Filter results" type="search" />
    );

    await expectNoViolations(container);
  });
});

describe("Switch", () => {
  it("has no accessibility violations", async () => {
    const { Switch } = await import("uireload/components/switch");

    const { container } = render(
      <>
        <Switch id="a" label="Reduce motion" defaultChecked />
        <Switch id="b" label="Beta features" aria-describedby="beta-hint" />
        <Switch id="c" label="Disabled" disabled defaultChecked />
        <Switch id="d" label="Required" required />
        <span id="beta-hint">Might change without warning</span>
      </>
    );

    await expectNoViolations(container);
  });

  it("has no violations in every scheme", async () => {
    const { Switch } = await import("uireload/components/switch");

    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      const { container, unmount } = renderWithProviders(
        <Switch id="s" label="Reduce motion" defaultChecked />,
        { scheme }
      );

      await expectNoViolations(container);
      unmount();
    }
  });
});

/*
 * The three overlays below render into a portal, so axe is run against `document.body` rather than
 * against the render container. Running it against `container` would pass trivially — the portalled
 * nodes are not inside it, so there would be nothing to find and the test would prove nothing.
 *
 * `body` is the wider scope, so these are genuinely stronger than the in-place components' checks.
 */
describe("Popover", () => {
  /**
   * `anchor` needs a DOM node, and the render `container` is assigned *by* the render call it would
   * be used inside, so it cannot be referenced there. `document.body` is the honest stand-in for
   * these checks: it is a real, measurable anchor, and axe is being run against it anyway because
   * the surface is portalled.
   */
  it("has no accessibility violations when open", async () => {
    const { Popover } = await import("uireload/components/popover");
    const { Button } = await import("uireload/components/button");

    render(
      <>
        <Button>Open</Button>
        <Popover
          open
          id="notifications"
          anchor={document.body}
          title="Notifications"
          footer={<Button>Mark all read</Button>}
        >
          <p>Nothing new.</p>
        </Popover>
      </>
    );

    await expectNoViolations(document.body);
  });

  it("has no violations when labelled only by aria-label", async () => {
    const { Popover } = await import("uireload/components/popover");

    render(
      <Popover open anchor={document.body} aria-label="Details">
        <p>Body</p>
      </Popover>
    );

    await expectNoViolations(document.body);
  });
});

describe("Dialog", () => {
  it("has no accessibility violations when open", async () => {
    const { Dialog } = await import("uireload/components/dialog");
    const { Button } = await import("uireload/components/button");

    render(
      <>
        <Button>Open</Button>
        <Dialog
          open
          id="confirm"
          title="Delete this project?"
          showCloseButton
          footer={
            <>
              <Button variant="ghost">Cancel</Button>
              <Button variant="solid" tone="danger">
                Delete
              </Button>
            </>
          }
        >
          <p>This cannot be undone.</p>
        </Dialog>
      </>
    );

    await expectNoViolations(document.body);
  });

  it("has no violations as an urgent dialog", async () => {
    const { Dialog } = await import("uireload/components/dialog");
    const { Button } = await import("uireload/components/button");

    render(
      <Dialog open id="destructive" title="Session expired" urgency="alert" tone="danger">
        <Button>Sign in again</Button>
      </Dialog>
    );

    // `role="alertdialog"` has the same required-children and naming rules as `dialog`; the urgency
    // must not cost the dialog its accessible name.
    await expectNoViolations(document.body);
  });

  it("has no violations with a close button and no title", async () => {
    const { Dialog } = await import("uireload/components/dialog");

    render(
      <Dialog open id="bare" label="Status" showCloseButton>
        <p>Everything is fine.</p>
      </Dialog>
    );

    await expectNoViolations(document.body);
  });

  it("has no violations in every scheme", async () => {
    const { Dialog } = await import("uireload/components/dialog");

    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      const { unmount } = renderWithProviders(
        <Dialog open id="s" title="Delete this project?" tone="danger" showCloseButton>
          <p>This cannot be undone.</p>
        </Dialog>,
        { scheme }
      );

      await expectNoViolations(document.body);
      unmount();
    }
  });
});

describe("Select", () => {
  const OPTIONS = [
    { value: "ams", label: "Amsterdam" },
    { value: "ber", label: "Berlin" },
    { value: "hel", label: "Helsinki", disabled: true },
  ];

  it("has no accessibility violations when closed", async () => {
    const { Select } = await import("uireload/components/select");

    const { container } = render(
      <Select id="region" label="Region" options={OPTIONS} helperText="Pick the nearest" />
    );

    await expectNoViolations(container);
  });

  it("has no violations with the listbox open", async () => {
    const user = userEvent.setup();
    const { Select } = await import("uireload/components/select");

    render(<Select id="region" label="Region" options={OPTIONS} defaultValue="ber" />);
    await user.click(screen.getByRole("button", { name: /Region/ }));

    // Portalled, so `document.body` again — see the note above the Popover block.
    await expectNoViolations(document.body);
  });

  it("has no violations with groups and a disabled option open", async () => {
    const user = userEvent.setup();
    const { Select } = await import("uireload/components/select");

    render(
      <Select
        id="state"
        label="Workflow state"
        options={[
          { value: "draft", label: "Draft" },
          { group: true, label: "Archived", options: OPTIONS },
        ]}
      />
    );
    await user.click(screen.getByRole("button", { name: /Workflow state/ }));

    await expectNoViolations(document.body);
  });

  it("has no violations when invalid, required or disabled", async () => {
    const { Select } = await import("uireload/components/select");

    const { container } = render(
      <>
        <Select id="a" label="Invalid" options={OPTIONS} invalid helperText="Choose one" required />
        <Select id="b" label="Disabled" options={OPTIONS} disabled defaultValue="ams" />
      </>
    );

    await expectNoViolations(container);
  });

  it("has no violations when labelled only by aria-label", async () => {
    const { Select } = await import("uireload/components/select");

    const { container } = render(
      <Select id="filter" label={undefined} aria-label="Filter by region" options={OPTIONS} />
    );

    await expectNoViolations(container);
  });

  it("has no violations in every scheme", async () => {
    const { Select } = await import("uireload/components/select");

    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      const { unmount } = renderWithProviders(
        <Select id="s" label="Region" options={OPTIONS} defaultValue="ber" invalid />,
        { scheme }
      );

      await expectNoViolations(document.body);
      unmount();
    }
  });
});

describe("Checkbox", () => {
  it("has no accessibility violations in any position", async () => {
    const { Checkbox } = await import("uireload/components/checkbox");

    const { container } = render(
      <>
        <Checkbox id="a" label="Unchecked" />
        <Checkbox id="b" label="Checked" defaultChecked />
        <Checkbox id="c" label="Indeterminate" indeterminate />
        <Checkbox id="d" label="Required" required disabled />
      </>
    );

    await expectNoViolations(container);
  });

  it("has no violations with a description and a label before the box", async () => {
    const { Checkbox } = await import("uireload/components/checkbox");

    const { container } = render(
      <Checkbox
        id="e"
        label="Subscribe"
        labelPosition="start"
        helperText="At most one email a week"
      />
    );

    await expectNoViolations(container);
  });
});

describe("RadioGroup", () => {
  const OPTIONS = [
    { value: "sms", label: "Text message" },
    { value: "email", label: "Email" },
    { value: "none", label: "Do not contact me", disabled: true },
  ];

  it("has no accessibility violations as a vertical group", async () => {
    const { RadioGroup } = await import("uireload/components/radio-group");

    const { container } = render(
      <RadioGroup id="contact" label="How should we contact you?" options={OPTIONS} />
    );

    await expectNoViolations(container);
  });

  it("has no violations horizontal, required, with a description", async () => {
    const { RadioGroup } = await import("uireload/components/radio-group");

    const { container } = render(
      <RadioGroup
        id="plan"
        label="Plan"
        options={OPTIONS}
        orientation="horizontal"
        required
        defaultValue="email"
        helperText="We never share this"
      />
    );

    await expectNoViolations(container);
  });
});

describe("Slider", () => {
  it("has no accessibility violations as a single thumb", async () => {
    const { Slider } = await import("uireload/components/slider");

    const { container } = render(
      <Slider id="volume" label="Volume" defaultValue={[40]} helperText="Applies to every device" />
    );

    await expectNoViolations(container);
  });

  it("has no violations as a range, with marks and a value text", async () => {
    const { Slider } = await import("uireload/components/slider");

    const { container } = render(
      <Slider
        id="price"
        label="Price range"
        defaultValue={[10, 80]}
        marks={[
          { value: 0, label: "$0" },
          { value: 50, label: "$50" },
          { value: 100, label: "$100" },
        ]}
        getAriaValueText={(value, index) => `${index === 0 ? "Minimum" : "Maximum"} $${value}`}
      />
    );

    await expectNoViolations(container);
  });

  it("has no violations inverted, vertical, or disabled", async () => {
    const { Slider } = await import("uireload/components/slider");

    const { container } = render(
      <>
        <Slider id="a" label="Brightness" defaultValue={[50, 90]} track="inverted" />
        <Slider id="b" label="Vertical" defaultValue={[30]} orientation="vertical" />
        <Slider id="c" label="Disabled" defaultValue={[30]} disabled />
      </>
    );

    await expectNoViolations(container);
  });
});

describe("Chip", () => {
  it("has no accessibility violations in every intent", async () => {
    const { Chip } = await import("uireload/components/chip");

    const { container } = render(
      <>
        <Chip>Static</Chip>
        <Chip intent="button">Activatable</Chip>
        <Chip intent="remove" onRemove={() => undefined}>
          Removable
        </Chip>
      </>
    );

    await expectNoViolations(container);
  });

  it("has no violations with an icon, a badge, or disabled", async () => {
    const { Chip } = await import("uireload/components/chip");

    const { container } = render(
      <>
        <Chip icon={<span>*</span>} tone="accent">
          With an icon
        </Chip>
        <Chip
          intent="remove"
          removeLabel="Remove the Weekly filter"
          disabled
          onRemove={() => undefined}
        >
          Weekly
        </Chip>
      </>
    );

    await expectNoViolations(container);
  });
});

describe("Link", () => {
  it("has no accessibility violations with and without a destination", async () => {
    const { Link } = await import("uireload/components/link");

    const { container } = render(
      <p>
        A <Link href="/docs">link with a destination</Link>, an{" "}
        <Link href="https://example.com" external target="_blank" rel="noopener">
          external one
        </Link>
        , and a <Link>link with none</Link>.
      </p>
    );

    await expectNoViolations(container);
  });

  it("has no violations disabled", async () => {
    const { Link } = await import("uireload/components/link");

    const { container } = render(
      <Link href="/docs" disabled>
        Unavailable
      </Link>
    );

    await expectNoViolations(container);
  });
});

describe("Tile", () => {
  it("has no accessibility violations in every form", async () => {
    const { Tile } = await import("uireload/components/tile");
    const { Button } = await import("uireload/components/button");

    const { container } = render(
      <>
        <Tile header={<p>Plain</p>}>Body</Tile>
        <Tile interactive>Activatable</Tile>
        <Tile href="/docs">A link</Tile>
        <Tile tone="danger" footer={<Button size="sm">Undo</Button>}>
          With a footer
        </Tile>
      </>
    );

    await expectNoViolations(container);
  });

  it("has no violations loading, or rendered as an article", async () => {
    const { Tile } = await import("uireload/components/tile");

    const { container } = render(
      <>
        <Tile loading>Body</Tile>
        <Tile as="article">An article</Tile>
      </>
    );

    await expectNoViolations(container);
  });
});

describe("TabBar", () => {
  it("has no accessibility violations with panels", async () => {
    const { TabBar } = await import("uireload/components/tab-bar");

    const { container } = render(
      <TabBar
        label="Sections"
        items={[
          { value: "a", label: "Overview", panel: "Overview panel" },
          { value: "b", label: "Errors", badge: "3", tone: "danger", panel: "Errors panel" },
          { value: "c", label: "Settings", panel: "Settings panel" },
        ]}
      />
    );

    await expectNoViolations(container);
  });

  it("has no violations vertical, lazy, with a disabled tab and no panel", async () => {
    const { TabBar } = await import("uireload/components/tab-bar");

    const { container } = render(
      <>
        <TabBar
          label="Sections"
          orientation="vertical"
          lazy
          items={[
            { value: "a", label: "One", panel: "One panel" },
            { value: "b", label: "Two", disabled: true, panel: "Two panel" },
            { value: "c", label: "Three" },
          ]}
        />
        <TabBar label="Panels" items={[{ value: "a", label: "Only a tab" }]} />
      </>
    );

    await expectNoViolations(container);
  });
});

describe("Snackbar", () => {
  it("has no accessibility violations when open", async () => {
    const { Snackbar } = await import("uireload/components/snackbar");
    const { Button } = await import("uireload/components/button");

    render(
      <Snackbar open duration={null} action={<Button size="sm">Undo</Button>} tone="positive">
        Settings saved.
      </Snackbar>
    );

    // `document.body`, because the surface is portalled — the same reasoning as `Popover`.
    await expectNoViolations(document.body);
  });

  it("has no violations closed, or assertively", async () => {
    const { Snackbar } = await import("uireload/components/snackbar");

    const { unmount } = render(<Snackbar>Saved</Snackbar>);
    await expectNoViolations(document.body);
    unmount();

    render(
      <Snackbar open duration={null} live="assertive" tone="danger">
        Payment failed.
      </Snackbar>
    );
    await expectNoViolations(document.body);
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
