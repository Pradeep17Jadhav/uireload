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

describe("Divider", () => {
  it("has no accessibility violations in any of its states", async () => {
    const { Divider } = await import("uireload/components/divider");

    const { container, rerender } = render(<Divider />);
    await expectNoViolations(container);

    rerender(<Divider decorative />);
    await expectNoViolations(container);

    // A structure role is not named from its contents, so the label is the case worth checking: it
    // is stated as `aria-label` rather than left to the text inside the rule.
    rerender(<Divider label="or continue with" />);
    await expectNoViolations(container);

    rerender(<Divider orientation="vertical" weight="thick" />);
    await expectNoViolations(container);
  });
});

describe("Skeleton", () => {
  it("has no accessibility violations in every variant", async () => {
    const { Skeleton } = await import("uireload/components/skeleton");

    for (const variant of ["text", "rounded", "circular"] as const) {
      const { container, unmount } = render(
        <Skeleton variant={variant} lines={4} width="100%" height={64} />
      );

      /*
       * The point of the run: every bar and shape is `aria-hidden`, so the only thing axe sees is one
       * named status region. A skeleton whose placeholders were announced would pass most rules and
       * still be a failure, which is why that is asserted in the component's own tests too.
       */
      await expectNoViolations(container);
      unmount();
    }
  });

  it("has no violations with a custom label or with the animation off", async () => {
    const { Skeleton } = await import("uireload/components/skeleton");

    const { container, rerender } = render(<Skeleton label="Loading your projects" lines={3} />);
    await expectNoViolations(container);

    rerender(<Skeleton animate={false} lines={1} />);
    await expectNoViolations(container);
  });
});

describe("Spinner", () => {
  it("has no accessibility violations in every size, thickness and tone", async () => {
    const { Spinner } = await import("uireload/components/spinner");

    for (const size of ["sm", "md", "lg"] as const) {
      for (const thickness of ["thin", "md", "thick"] as const) {
        const { container, unmount } = render(<Spinner size={size} thickness={thickness} />);

        await expectNoViolations(container);
        unmount();
      }
    }
  });

  it("has no violations when labelled, which is the form that reaches the tree", async () => {
    const { Spinner } = await import("uireload/components/spinner");

    /*
     * The labelled form is the one axe has anything to check: an unlabelled spinner is
     * `aria-hidden` and therefore invisible to every rule. Both are run because the decorative
     * form is only safe *because* it is hidden, and that is a claim worth testing.
     */
    const { container, unmount } = render(<Spinner label="Loading your projects" />);
    await expectNoViolations(container);
    unmount();

    const decorative = render(<Spinner />);
    await expectNoViolations(decorative.container);
  });
});

describe("Loader", () => {
  it("has no accessibility violations when determinate, in every tone", async () => {
    const { Loader } = await import("uireload/components/loader");

    for (const tone of ["neutral", "accent", "positive", "danger"] as const) {
      const { container, unmount } = render(<Loader value={40} tone={tone} />);

      await expectNoViolations(container);
      unmount();
    }
  });

  it("has no violations when indeterminate, or carrying a value label", async () => {
    const { Loader } = await import("uireload/components/loader");

    const { container, rerender } = render(<Loader />);
    await expectNoViolations(container);

    rerender(<Loader value={20} showValue />);
    await expectNoViolations(container);

    rerender(<Loader value={20} valueLabel="Step 2 of 7 - verifying" showValue />);
    await expectNoViolations(container);
  });

  it("has no violations with an out-of-range value", async () => {
    const { Loader } = await import("uireload/components/loader");

    const { container } = render(<Loader value={140} showValue />);
    await expectNoViolations(container);
  });
});

describe("Accordion", () => {
  it("has no accessibility violations with a panel open", async () => {
    const { Accordion } = await import("uireload/components/accordion");

    const { container, unmount } = render(
      <Accordion
        items={[
          { id: "one", title: "What is included?", children: <p>Everything in the base plan.</p> },
          { id: "two", title: "Can I cancel?", children: <p>At any time.</p> },
        ]}
        defaultValue="one"
      />
    );

    await expectNoViolations(container);
    unmount();
  });

  it("has no violations when everything is collapsed", async () => {
    const { Accordion } = await import("uireload/components/accordion");

    /*
     * The collapsed form is the one that can go wrong: a hidden panel whose region is still exposed, or a
     * header with `aria-controls` pointing at nothing. Both are structural, so they are checked here rather
     * than only in the component's own suite.
     */
    const { container } = render(
      <Accordion
        items={[
          { id: "one", title: "Question one", children: <p>Answer one.</p> },
          { id: "two", title: "Question two", children: <p>Answer two.</p> },
          { id: "three", title: "Question three", children: <p>Answer three.</p> },
        ]}
      />
    );

    await expectNoViolations(container);
  });

  it("has no violations with a permanently open panel, a disabled item, or multiple selection", async () => {
    const { Accordion } = await import("uireload/components/accordion");

    const items = [
      { id: "one", title: "Step one", children: <input aria-label="First" /> },
      { id: "two", title: "Step two", children: <input aria-label="Second" />, disabled: true },
    ];

    const pinned = render(<Accordion items={items} defaultValue="one" allowAllClosed={false} />);
    await expectNoViolations(pinned.container);
    pinned.unmount();

    const multiple = render(
      <Accordion items={items} selectionMode="multiple" defaultValue={["one", "two"]} />
    );
    await expectNoViolations(multiple.container);
    multiple.unmount();

    const headings = render(<Accordion items={items} headingLevel={4} defaultValue="one" />);
    await expectNoViolations(headings.container);
  });
});

describe("Menu", () => {
  /*
   * Run against `document.body` rather than a container, because the menu renders into a portal and would
   * otherwise not be in the tree axe inspects. A menu test that silently inspects an empty container is the
   * easiest way to have an accessibility suite that never actually looked at the menu.
   */
  it("has no accessibility violations for a menu of actions", async () => {
    const { Menu } = await import("uireload/components/menu");

    render(
      <Menu
        anchor={document.body}
        open
        label="Edit menu"
        items={[
          { id: "cut", label: "Cut" },
          { id: "copy", label: "Copy" },
          { id: "sep", type: "separator" },
          { id: "bold", label: "Bold", role: "menuitemcheckbox" },
          { id: "locked", label: "Locked", disabled: true },
        ]}
      />
    );

    await expectNoViolations(document.body);
  });

  it("has no violations when an item is checked or radio-selected", async () => {
    const { Menu } = await import("uireload/components/menu");

    render(
      <Menu
        anchor={document.body}
        open
        label="View menu"
        items={[
          { id: "grid", label: "Grid", role: "menuitemradio", checked: true },
          { id: "list", label: "List", role: "menuitemradio" },
          { id: "ruler", label: "Ruler", role: "menuitemcheckbox", checked: false },
        ]}
      />
    );

    await expectNoViolations(document.body);
  });

  it("has no violations with an icon, a description, or no explicit label", async () => {
    const { Menu } = await import("uireload/components/menu");

    render(
      <Menu
        anchor={document.body}
        open
        items={[{ id: "share", label: "Share", description: "Anyone with the link", icon: "•" }]}
      />
    );

    // Falls back to the catalogue name rather than rendering an unnamed menu.
    await expectNoViolations(document.body);
  });
});

describe("Navbar", () => {
  it("has no accessibility violations as a horizontal bar", async () => {
    const { Navbar } = await import("uireload/components/navbar");

    const { container, unmount } = render(
      <Navbar
        label="Main"
        current="projects"
        brand={<span>Acme</span>}
        items={[
          { id: "home", label: "Home", href: "/" },
          { id: "projects", label: "Projects", href: "/projects" },
          { id: "admin", label: "Admin", href: "/admin", disabled: true },
        ]}
      />
    );

    await expectNoViolations(container);
    unmount();
  });

  it("has no violations as a vertical sidebar, or with mixed item kinds", async () => {
    const { Navbar } = await import("uireload/components/navbar");

    /*
     * The mixed case is the one worth checking: a link, a button and inert text in one list is three
     * different element types, and the inert entry in particular must not be announced as a control.
     */
    const { container, unmount } = render(
      <Navbar
        label="Account"
        orientation="vertical"
        items={[
          { id: "home", label: "Home", href: "/", description: "Back to the dashboard" },
          { id: "signout", label: "Sign out", onSelect: () => {} },
          { id: "soon", label: "Coming soon" },
        ]}
      />
    );

    await expectNoViolations(container);
    unmount();
  });

  it("has no violations with an icon and the catalogue name", async () => {
    const { Navbar } = await import("uireload/components/navbar");

    // No `label`, so the landmark takes the catalogue's name rather than being announced as "navigation".
    const { container } = render(
      <Navbar
        current="home"
        items={[
          { id: "home", label: "Home", href: "/", icon: "★" },
          { id: "starred", label: "Starred", href: "/starred" },
        ]}
      />
    );

    await expectNoViolations(container);
  });
});

describe("Avatar", () => {
  it("has no accessibility violations for each of its three fallbacks", async () => {
    const { Avatar } = await import("uireload/components/avatar");

    // An image that names the person, an image that is decorative, and initials — three different
    // accessibility contracts that all have to pass.
    const named = render(<Avatar alt="Ada Lovelace" initials="AL" src="/a.png" />);
    await expectNoViolations(named.container);
    named.unmount();

    const decorative = render(<Avatar alt="" initials="AL" src="/a.png" />);
    await expectNoViolations(decorative.container);
    decorative.unmount();

    const initials = render(<Avatar initials="AL" />);
    await expectNoViolations(initials.container);
    initials.unmount();
  });

  it("has no violations when interactive, or interactive and disabled", async () => {
    const { Avatar } = await import("uireload/components/avatar");

    const enabled = render(
      <Avatar interactive initials="AL" badge={<span data-testid="b">3</span>} />
    );
    await expectNoViolations(enabled.container);
    enabled.unmount();

    const disabled = render(<Avatar disabled interactive initials="AL" />);
    await expectNoViolations(disabled.container);
  });
});

describe("Alert", () => {
  it("has no accessibility violations in every tone, variant and urgency", async () => {
    const { Alert } = await import("uireload/components/alert");

    for (const tone of ["neutral", "accent", "positive", "danger"] as const) {
      for (const variant of ["subtle", "outlined", "solid"] as const) {
        const { container, unmount } = render(
          <Alert
            action={<button type="button">Retry</button>}
            dismissible
            title="Payment failed"
            tone={tone}
            variant={variant}
          >
            We could not charge your card.
          </Alert>
        );

        await expectNoViolations(container);
        unmount();
      }
    }
  });

  it("has no violations with the contradictory role and urgency, which warns in development", async () => {
    const { Alert } = await import("uireload/components/alert");
    const warn = console.warn;
    console.warn = () => undefined;

    try {
      const { container } = render(
        <Alert role="status" urgency="assertive" tone="danger">
          Contradictory.
        </Alert>
      );

      await expectNoViolations(container);
    } finally {
      console.warn = warn;
    }
  });
});

describe("Tooltip", () => {
  it("has no accessibility violations while shown and while hidden", async () => {
    const { Tooltip } = await import("uireload/components/tooltip");

    const { rerender } = render(
      <Tooltip label="Delete this project">
        <button type="button">Delete</button>
      </Tooltip>
    );

    // `document.body`, because the surface is portalled — the same reasoning as `Popover`.
    await expectNoViolations(document.body);

    rerender(
      <Tooltip label="Delete this project" open>
        <button type="button">Delete</button>
      </Tooltip>
    );
    await expectNoViolations(document.body);
  });

  it("has no violations when the tooltip is the accessible name", async () => {
    const { Tooltip } = await import("uireload/components/tooltip");

    render(
      <Tooltip describe="label" label="Delete project" open>
        <button type="button">×</button>
      </Tooltip>
    );

    // `aria-label` on the wrapper is the case where a wrong choice produces a button announced as
    // "button" and nothing else, so it is the one worth running axe over.
    await expectNoViolations(document.body);
  });
});

describe("Drawer", () => {
  it("has no accessibility violations when modal", async () => {
    const { Drawer } = await import("uireload/components/drawer");

    render(
      <Drawer modal open title="Confirm" footer={<button type="button">Delete</button>}>
        <p>This cannot be undone.</p>
      </Drawer>
    );

    await expectNoViolations(document.body);
  });

  it("has no violations when not modal, in every placement", async () => {
    const { Drawer } = await import("uireload/components/drawer");

    for (const placement of ["inline-start", "inline-end", "block-start", "block-end"] as const) {
      const { unmount } = render(
        <Drawer open placement={placement} title="Navigation">
          <nav aria-label="Sections">
            <ul>
              <li>Overview</li>
            </ul>
          </nav>
        </Drawer>
      );

      await expectNoViolations(document.body);
      unmount();
    }
  });

  it("has no violations without a title, or without a close control", async () => {
    const { Drawer } = await import("uireload/components/drawer");

    const named = render(
      <Drawer open aria-label="Filters">
        <p>No title, so the name comes from the root props.</p>
      </Drawer>
    );
    await expectNoViolations(document.body);
    named.unmount();

    render(
      <Drawer open showClose={false} title="Pick a workspace">
        <button type="button">Acme Inc</button>
      </Drawer>
    );
    await expectNoViolations(document.body);
  });
});

describe("Pagination", () => {
  it("has no accessibility violations with the window, and with every page", async () => {
    const { Pagination } = await import("uireload/components/pagination");

    const { container, rerender } = render(<Pagination page={10} pageCount={20} />);
    await expectNoViolations(container);

    rerender(<Pagination page={10} pageCount={20} siblingCount="all" />);
    await expectNoViolations(container);
  });

  it("has no violations at either end, without edges, or disabled", async () => {
    const { Pagination } = await import("uireload/components/pagination");

    for (const page of [0, 19]) {
      const atEnd = render(<Pagination page={page} pageCount={20} />);
      await expectNoViolations(atEnd.container);
      atEnd.unmount();
    }

    const noEdges = render(<Pagination page={4} pageCount={20} showEdges={false} />);
    await expectNoViolations(noEdges.container);
    noEdges.unmount();

    const disabled = render(<Pagination disabled page={4} pageCount={20} />);
    await expectNoViolations(disabled.container);
  });
});

describe("Stepper", () => {
  it("has no accessibility violations in linear and non-linear mode", async () => {
    const { Stepper } = await import("uireload/components/stepper");

    const steps = [
      { id: "a", label: "Account" },
      { id: "b", label: "Profile", description: "Name and photo" },
      { id: "c", label: "Billing" },
      { id: "d", label: "Review" },
    ];

    for (const navigation of ["linear", "non-linear"] as const) {
      for (const orientation of ["horizontal", "vertical"] as const) {
        const { container, unmount } = render(
          <Stepper
            label="Checkout"
            navigation={navigation}
            orientation={orientation}
            steps={steps}
            active={2}
          />
        );

        /*
         * The case worth running: in linear mode the current step has no button, so `aria-current`
         * must be on a `<div>` or the strip communicates nothing at all — and an `aria-current` on a
         * plain element is exactly the sort of thing axe's structure rules catch.
         */
        await expectNoViolations(container);
        unmount();
      }
    }
  });

  it("has no violations with an error, an optional step, and a locked step", async () => {
    const { Stepper } = await import("uireload/components/stepper");

    const { container } = render(
      <Stepper
        active={2}
        navigation="non-linear"
        steps={[
          { id: "a", label: "Account" },
          { id: "b", label: "Identity check", disabled: true },
          {
            id: "c",
            label: "Billing",
            optional: true,
            tone: "danger",
            errorText: "Card number is invalid",
          },
          { id: "d", label: "Review" },
        ]}
      />
    );

    await expectNoViolations(container);
  });

  it("has no violations with content, or disabled", async () => {
    const { Stepper } = await import("uireload/components/stepper");

    const withContent = render(
      <Stepper active={1} showContent steps={[{ id: "a", label: "Account" }]}>
        <p>Step body.</p>
      </Stepper>
    );
    await expectNoViolations(withContent.container);
    withContent.unmount();

    const disabled = render(
      <Stepper
        disabled
        active={2}
        steps={[
          { id: "a", label: "Account" },
          { id: "b", label: "Review" },
        ]}
      />
    );
    await expectNoViolations(disabled.container);
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
