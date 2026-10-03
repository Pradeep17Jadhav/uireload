/**
 * Alert tests.
 *
 * The centre of gravity is role and urgency agreeing with each other. They are the same fact stated
 * twice, and letting them disagree produces an error banner that waits its turn to be read.
 */

import { createRef, type MouseEvent as ReactMouseEvent } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "uireload-test";

import { Alert } from "uireload/components/alert";

describe("Alert: role and urgency", () => {
  it("is a polite status by default", () => {
    render(<Alert>Saved</Alert>);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
  });

  it("becomes assertive for a danger tone, without being asked", () => {
    render(<Alert tone="danger">Failed</Alert>);

    /*
     * The one tone that means "this will cost you" is the only one that justifies interrupting a
     * screen reader mid-sentence. Deriving it means reaching for `tone` gets the right announcement
     * without reaching for a second prop.
     */
    expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "assertive");
  });

  it("stays polite for the other three tones", () => {
    for (const tone of ["neutral", "accent", "positive"] as const) {
      const { unmount } = render(<Alert tone={tone}>Message</Alert>);
      expect(screen.getByRole("status"), tone).toBeInTheDocument();
      unmount();
    }
  });

  it("lets an explicit urgency win over the tone", () => {
    render(
      <Alert tone="danger" urgency="polite">
        Failed
      </Alert>
    );

    // A danger message the consumer wants announced quietly — in a form that re-announces on every
    // keystroke, for instance.
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("is atomic, so a replacement is read whole", () => {
    render(<Alert>3 failed</Alert>);

    /*
     * Without `aria-atomic`, replacing "3 items failed" with "3 items failed, 1 recovered" announces
     * "1 recovered" with no context at all.
     */
    expect(screen.getByRole("status")).toHaveAttribute("aria-atomic", "true");
  });

  it("warns when role and urgency contradict", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    render(
      <Alert role="status" urgency="assertive">
        Contradictory
      </Alert>
    );

    const messages = warn.mock.calls.map((call) => String(call[0]));
    expect(messages.some((message) => message.includes("contradictory"))).toBe(true);
    warn.mockRestore();
  });

  it("says nothing when role agrees with urgency", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    render(
      <Alert role="alert" urgency="assertive" tone="danger">
        Consistent
      </Alert>
    );

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("Alert: content", () => {
  it("renders the message", () => {
    render(<Alert>Something happened</Alert>);

    expect(screen.getByText("Something happened")).toBeInTheDocument();
  });

  it("renders the title as a real heading", () => {
    render(<Alert title="Payment failed">Try again later.</Alert>);

    /*
     * A bold `<div>` is not in a screen reader's heading list, and the heading list is how a user
     * skips past this to the content they came for.
     */
    expect(screen.getByRole("heading", { name: "Payment failed" })).toBeInTheDocument();
  });

  it("defaults the title to h3, so it does not outrank its section", () => {
    render(<Alert title="Note">Body</Alert>);

    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
  });

  it("accepts a different title level", () => {
    render(
      <Alert title="Note" titleLevel="h2">
        Body
      </Alert>
    );

    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });

  it("renders no heading when there is no title", () => {
    render(<Alert>Body only</Alert>);

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("renders actions", () => {
    render(<Alert action={<button type="button">Retry</button>}>Failed</Alert>);

    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("draws no glyph for a neutral alert", () => {
    render(<Alert>Message</Alert>);

    // An information mark beside text that says nothing is decoration.
    expect(document.querySelector(".uir-alert__glyph")).toBeNull();
  });

  it("draws a glyph for a toned alert", () => {
    render(<Alert tone="danger">Failed</Alert>);

    const glyph = document.querySelector(".uir-alert__glyph");
    expect(glyph).toBeInTheDocument();
    expect(glyph).toHaveAttribute("aria-hidden", "true");
  });

  it("prefers a custom icon and hides it", () => {
    render(
      <Alert icon={<span data-testid="i">!</span>} tone="danger">
        Failed
      </Alert>
    );

    expect(screen.getByTestId("i")).toBeInTheDocument();
    expect(document.querySelector(".uir-alert__icon")).toHaveAttribute("aria-hidden", "true");
    expect(document.querySelector(".uir-alert__glyph")).toBeNull();
  });
});

describe("Alert: dismiss", () => {
  it("shows no dismiss control by default", () => {
    render(<Alert>Message</Alert>);

    /*
     * An alert that dismisses itself is a message the user can lose, and an alert is almost always
     * information they need to still have.
     */
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls onDismiss and stays", () => {
    const onDismiss = vi.fn();
    render(
      <Alert dismissible onDismiss={onDismiss}>
        Message
      </Alert>
    );

    screen.getByRole("button", { name: "Close" }).click();

    expect(onDismiss).toHaveBeenCalledTimes(1);
    // The consumer owns whether it goes away.
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("accepts a custom dismiss label", () => {
    render(
      <Alert dismissible dismissLabel="Dismiss this notice" onDismiss={() => undefined}>
        Message
      </Alert>
    );

    expect(screen.getByRole("button", { name: "Dismiss this notice" })).toBeInTheDocument();
  });

  it("runs the root's own click handler exactly once for a dismiss", () => {
    const onClick = vi.fn();
    const onDismiss = vi.fn();
    render(
      <Alert dismissible onClick={onClick} onDismiss={onDismiss}>
        Message
      </Alert>
    );

    screen.getByRole("button", { name: "Close" }).click();

    /*
     * The root is an ancestor of the button, so `onClick` could run by bubbling *and* by being composed
     * into the control. It runs exactly once — and it runs first, because a consumer who can
     * `preventDefault()` a dismissal must do so before it happens, not after.
     */
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("lets a consumer veto the dismissal with preventDefault", () => {
    const onClick = (event: ReactMouseEvent<HTMLDivElement>): void => {
      event.preventDefault();
    };
    const onDismiss = vi.fn();

    render(
      <Alert dismissible onClick={onClick} onDismiss={onDismiss}>
        Message
      </Alert>
    );

    screen.getByRole("button", { name: "Close" }).click();

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("runs a consumer handler on the control first", async () => {
    const user = userEvent.setup();
    const order: string[] = [];

    render(
      <Alert
        dismissible
        onClick={() => order.push("consumer")}
        onDismiss={() => order.push("internal")}
      >
        Message
      </Alert>
    );

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(order[0]).toBe("consumer");
  });
});

describe("Alert: presentation", () => {
  it("exposes state as data attributes, not class names", () => {
    render(
      <Alert tone="positive" variant="solid" title="Done" action={<span>Go</span>}>
        Message
      </Alert>
    );

    const root = screen.getByRole("status");
    expect(root).toHaveAttribute("data-tone", "positive");
    expect(root).toHaveAttribute("data-variant", "solid");
    expect(root).toHaveAttribute("data-urgency", "polite");
    expect(root).toHaveAttribute("data-has-title", "");
    expect(root).toHaveAttribute("data-has-action", "");
    expect(root.className).not.toMatch(/positive|solid/);
  });

  it("merges a consumer className onto the root", () => {
    render(<Alert className="consumer-class">Message</Alert>);

    expect(screen.getByRole("status")).toHaveClass("uir-alert", "consumer-class");
  });

  it("forwards its ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Alert ref={ref}>Message</Alert>);

    expect(ref.current).toBe(screen.getByRole("status"));
  });
});

describe("Alert: direction and scheme", () => {
  it("renders in RTL", () => {
    renderWithProviders(<Alert tone="danger">فشل</Alert>, { dir: "rtl" });

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders every tone in every variant in every scheme", () => {
    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      for (const variant of ["subtle", "outlined", "solid"] as const) {
        for (const tone of ["neutral", "accent", "positive", "danger"] as const) {
          const { unmount } = renderWithProviders(
            <Alert tone={tone} variant={variant} title="Title">
              Message
            </Alert>,
            { scheme }
          );

          const role = tone === "danger" ? "alert" : "status";
          expect(screen.getByRole(role), `${scheme}/${variant}/${tone}`).toBeInTheDocument();
          unmount();
        }
      }
    }
  });
});
