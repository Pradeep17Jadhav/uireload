/**
 * Snackbar tests.
 *
 * The centre of gravity is the two behaviours that stop a snackbar from stealing the user's place:
 * the timer pauses while they are interacting with it, and the close reason is reported. Both are
 * invisible until they are wrong, and both fail silently when they are.
 */

import { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "uireload-test";

import { Snackbar } from "uireload/components/snackbar";

/** The snackbar, when it is open. */
function bar(): HTMLElement {
  return document.querySelector(".uir-snackbar") as HTMLElement;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("Snackbar: rendering", () => {
  it("is hidden rather than absent when closed", () => {
    render(<Snackbar>Saved</Snackbar>);

    /*
     * The live region must exist before its content changes or the announcement is frequently lost
     * entirely: assistive technology observes changes inside a region it already knows about, and a
     * region created at the same moment as its text has nothing to observe.
     */
    expect(bar()).toBeInTheDocument();
    expect(bar()).not.toHaveAttribute("data-open");
  });

  it("is marked open when open", () => {
    render(<Snackbar open>Saved</Snackbar>);

    expect(bar()).toHaveAttribute("data-open", "");
  });

  it("is a live region from the first render", () => {
    render(<Snackbar>Saved</Snackbar>);

    expect(bar()).toHaveAttribute("aria-live", "polite");
    expect(bar()).toHaveAttribute("aria-atomic", "true");
  });

  it("takes an assertive region when asked", () => {
    render(<Snackbar live="assertive">Saved</Snackbar>);

    // Assertive interrupts whatever is being read, which is right for an error and wrong for
    // everything else.
    expect(bar()).toHaveAttribute("aria-live", "assertive");
  });

  it("removes the live region when live is off", () => {
    render(<Snackbar live="off">Saved</Snackbar>);

    expect(bar()).not.toHaveAttribute("aria-live");
  });

  it("renders the message, an action and a close control", () => {
    render(
      <Snackbar open action={<button type="button">Undo</button>}>
        Saved
      </Snackbar>
    );

    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("hides the close control when asked", () => {
    render(
      <Snackbar open showClose={false}>
        Saved
      </Snackbar>
    );

    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("draws no glyph for a neutral tone", () => {
    render(<Snackbar open>Saved</Snackbar>);

    // An information mark beside text that says nothing is decoration.
    expect(document.querySelector(".uir-snackbar__glyph")).toBeNull();
  });

  it("draws a glyph for a toned snackbar", () => {
    render(
      <Snackbar open tone="danger">
        Failed
      </Snackbar>
    );

    expect(document.querySelector(".uir-snackbar__glyph")).toBeInTheDocument();
  });

  it("exposes state as data attributes, not class names", () => {
    render(
      <Snackbar open placement="top-start" tone="positive" action={<span>Undo</span>}>
        Saved
      </Snackbar>
    );

    expect(bar()).toHaveAttribute("data-placement", "top-start");
    expect(bar()).toHaveAttribute("data-tone", "positive");
    expect(bar()).toHaveAttribute("data-has-action", "");
    expect(bar().className).not.toMatch(/top|positive/);
  });

  it("merges a consumer className onto the root", () => {
    render(
      <Snackbar open className="consumer-class">
        Saved
      </Snackbar>
    );

    expect(bar()).toHaveClass("uir-snackbar", "consumer-class");
  });
});

describe("Snackbar: the timer", () => {
  it("closes on a timeout", () => {
    const onClose = vi.fn();
    render(
      <Snackbar open duration={5000} onClose={onClose}>
        Saved
      </Snackbar>
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onClose).toHaveBeenCalledWith("timeout");
  });

  it("floors the duration at five seconds", () => {
    const onClose = vi.fn();
    render(
      <Snackbar open duration={500} onClose={onClose}>
        Saved
      </Snackbar>
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });

    /*
     * Below 5s a message is more likely to disappear while it is being read than to have been read,
     * and the failure is invisible to whoever set the timer.
     */
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onClose).toHaveBeenCalledWith("timeout");
  });

  it("never closes on a timer when duration is null", () => {
    const onClose = vi.fn();
    render(
      <Snackbar open duration={null} onClose={onClose}>
        Saved
      </Snackbar>
    );

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not start a timer while closed", () => {
    const onClose = vi.fn();
    render(
      <Snackbar duration={5000} onClose={onClose}>
        Saved
      </Snackbar>
    );

    act(() => {
      vi.advanceTimersByTime(20_000);
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("starts a fresh countdown each time it opens", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Snackbar open={false} duration={5000} onClose={onClose}>
        Saved
      </Snackbar>
    );

    rerender(
      <Snackbar open duration={5000} onClose={onClose}>
        Saved
      </Snackbar>
    );
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    rerender(
      <Snackbar open={false} duration={5000} onClose={onClose}>
        Saved
      </Snackbar>
    );
    rerender(
      <Snackbar open duration={5000} onClose={onClose}>
        Saved
      </Snackbar>
    );

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    // The spent 4s from the first open must not be carried into the second.
    expect(onClose).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("Snackbar: pause and resume", () => {
  it("pauses while the pointer is over it", () => {
    const onClose = vi.fn();
    render(
      <Snackbar open duration={5000} onClose={onClose}>
        Saved
      </Snackbar>
    );

    fireEvent.pointerEnter(bar());
    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(onClose).not.toHaveBeenCalled();
    expect(bar()).toHaveAttribute("data-paused", "");
  });

  it("resumes with the time that was left, not a fresh countdown", () => {
    const onClose = vi.fn();
    render(
      <Snackbar open duration={5000} onClose={onClose}>
        Saved
      </Snackbar>
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    fireEvent.pointerEnter(bar());
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    fireEvent.pointerLeave(bar());
    act(() => {
      vi.advanceTimersByTime(2900);
    });

    // 3s of the original 5s were left, not 5s.
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(onClose).toHaveBeenCalledWith("timeout");
  });

  it("pauses while focus is inside it", () => {
    const onClose = vi.fn();
    render(
      <Snackbar open duration={5000} onClose={onClose}>
        Saved
      </Snackbar>
    );

    /*
     * The case the pause exists for: a keyboard user tabs into the snackbar's action, and a timer that
     * keeps running removes the element they are standing on.
     */
    fireEvent.focus(bar());
    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("resumes when focus leaves", () => {
    const onClose = vi.fn();
    render(
      <Snackbar open duration={5000} onClose={onClose}>
        Saved
      </Snackbar>
    );

    fireEvent.focus(bar());
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    fireEvent.blur(bar());
    act(() => {
      vi.advanceTimersByTime(4900);
    });

    expect(onClose).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(100);
    });
    // Nothing was spent while focused, so the full 5s was still left on leaving.
    expect(onClose).toHaveBeenCalledWith("timeout");
  });

  it("does not pause when asked not to", () => {
    const onClose = vi.fn();
    render(
      <Snackbar open duration={5000} pauseOnHover={false} onClose={onClose}>
        Saved
      </Snackbar>
    );

    fireEvent.pointerEnter(bar());
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onClose).toHaveBeenCalledWith("timeout");
  });

  it("resumes to a permanent message when duration is null", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Snackbar open duration={null} onClose={onClose}>
        Saved
      </Snackbar>
    );

    /*
     * A permanent message must not acquire a countdown the moment a pointer touches it. There is no
     * remaining time to resume, so pausing is a no-op.
     */
    fireEvent.pointerEnter(bar());
    rerender(
      <Snackbar open duration={5000} onClose={onClose}>
        Saved
      </Snackbar>
    );
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onClose).toHaveBeenCalledWith("timeout");
  });
});

describe("Snackbar: dismissal", () => {
  it("dismisses with the close control", () => {
    const onClose = vi.fn();
    const onDismiss = vi.fn();
    render(
      <Snackbar open onClose={onClose} onDismiss={onDismiss}>
        Saved
      </Snackbar>
    );

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledWith("dismiss");
    expect(onDismiss).toHaveBeenCalledWith("dismiss");
  });

  it("dismisses with Escape, without stealing it from a dialog behind", () => {
    const onClose = vi.fn();
    render(
      <Snackbar open onClose={onClose}>
        Saved
      </Snackbar>
    );

    fireEvent.keyDown(bar(), { key: "Escape" });

    expect(onClose).toHaveBeenCalledWith("escape");
  });

  it("ignores other keys", () => {
    const onClose = vi.fn();
    render(
      <Snackbar open onClose={onClose}>
        Saved
      </Snackbar>
    );

    fireEvent.keyDown(bar(), { key: "a" });
    fireEvent.keyDown(bar(), { key: "Tab" });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not dismiss on a click outside by default", () => {
    const onClose = vi.fn();
    render(
      <Snackbar open onClose={onClose}>
        Saved
      </Snackbar>
    );

    /*
     * Dismiss-on-click-away is a convenience on a message with no controls and a hazard on one with
     * them: a stray click on a message carrying a button throws away what the user was reaching for.
     */
    fireEvent.pointerDown(document.body);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not dismiss on a click inside", () => {
    const onClose = vi.fn();
    render(
      <Snackbar open dismissOnClickOutside onClose={onClose}>
        Saved
      </Snackbar>
    );

    fireEvent.pointerDown(screen.getByText("Saved"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("reports a reason, so a consumer can tell a timeout from a dismissal", () => {
    const onDismiss = vi.fn();
    const { rerender } = render(
      <Snackbar open duration={5000} onDismiss={onDismiss}>
        Saved
      </Snackbar>
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    rerender(
      <Snackbar open={false} onDismiss={onDismiss}>
        Saved
      </Snackbar>
    );
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    // A timed-out message and a dismissed one want different responses.
    expect(onDismiss.mock.calls).toEqual([["timeout"], ["dismiss"]]);
  });

  it("reports a reason once, even when the timer and a key land together", () => {
    const onClose = vi.fn();
    render(
      <Snackbar open duration={5000} onClose={onClose}>
        Saved
      </Snackbar>
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    fireEvent.keyDown(bar(), { key: "Escape" });

    // A consumer that enqueues an undo on onClose would otherwise offer it twice.
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("Snackbar: controlled and uncontrolled", () => {
  it("closes itself when uncontrolled", () => {
    render(
      <Snackbar defaultOpen duration={5000}>
        Saved
      </Snackbar>
    );

    expect(bar()).toHaveAttribute("data-open", "");
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(bar()).not.toHaveAttribute("data-open");
  });

  it("stays open when controlled, and only reports", () => {
    const onClose = vi.fn();
    render(
      <Snackbar open duration={5000} onClose={onClose}>
        Saved
      </Snackbar>
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onClose).toHaveBeenCalledWith("timeout");
    // React is the source of truth; we report and the consumer decides.
    expect(bar()).toHaveAttribute("data-open", "");
  });

  it("works controlled by external state", () => {
    const seen: string[] = [];

    function Controlled() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <Snackbar
            open={open}
            duration={5000}
            onClose={(reason) => {
              seen.push(reason);
              // The consumer decides whether a timeout should close it.
              if (reason !== "timeout") setOpen(false);
            }}
          >
            Saved
          </Snackbar>
          <button type="button">Elsewhere</button>
        </>
      );
    }

    render(<Controlled />);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(seen).toEqual(["dismiss"]);
    expect(bar()).not.toHaveAttribute("data-open");

    // A timeout the consumer declined to act on leaves it open, which is the whole point of a reason.
    act(() => {
      vi.advanceTimersByTime(0);
    });
  });

  it("starts closed and opens from defaultOpen", () => {
    render(<Snackbar defaultOpen>Saved</Snackbar>);

    expect(bar()).toHaveAttribute("data-open", "");
  });
});

describe("Snackbar: direction and scheme", () => {
  it("renders in RTL", () => {
    renderWithProviders(<Snackbar open>تم الحفظ</Snackbar>, { dir: "rtl" });

    expect(screen.getByText("تم الحفظ")).toBeInTheDocument();
  });

  it("renders every tone in every colour scheme", () => {
    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      for (const tone of ["neutral", "accent", "positive", "danger"] as const) {
        const { unmount } = renderWithProviders(
          <Snackbar open tone={tone}>
            Message
          </Snackbar>,
          { scheme }
        );

        expect(screen.getByText("Message"), `${scheme}/${tone}`).toBeInTheDocument();
        unmount();
      }
    }
  });
});
