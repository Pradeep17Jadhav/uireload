import { useRef, useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  FOCUSABLE_SELECTOR,
  ROVING_ITEM_ATTRIBUTE,
  focusElement,
  getRovingItems,
  getTabbableElements,
  useFocusTrap,
  useRovingFocus,
} from "./focus";

describe("FOCUSABLE_SELECTOR", () => {
  it("covers the elements a composite widget may contain", () => {
    document.body.innerHTML = `
      <a href="#x">link</a>
      <button>button</button>
      <button disabled>disabled</button>
      <input />
      <input type="hidden" />
      <select></select>
      <textarea></textarea>
      <div tabindex="0">div</div>
      <div tabindex="-1">skip</div>
      <div contenteditable="true">editable</div>
    `;

    const found = Array.from(document.body.querySelectorAll(FOCUSABLE_SELECTOR));

    expect(found.map((el) => el.tagName.toLowerCase())).toEqual(
      expect.arrayContaining(["a", "button", "input", "select", "textarea"])
    );

    // `disabled`, `type=hidden` and `tabindex="-1"` must all be excluded.
    expect(found).not.toContain(document.body.querySelector("button[disabled]"));
    expect(found).not.toContain(document.body.querySelector('[tabindex="-1"]'));
    expect(found).not.toContain(document.body.querySelector('input[type="hidden"]'));
  });
});

describe("getTabbableElements", () => {
  it("returns an empty array for a missing container", () => {
    expect(getTabbableElements(null)).toEqual([]);
  });

  it("returns tabbable descendants in DOM order", () => {
    document.body.innerHTML = `
      <div id="c">
        <button id="a">a</button>
        <span><button id="b">b</button></span>
        <button id="c2">c</button>
      </div>`;

    expect(getTabbableElements(document.getElementById("c")).map((el) => el.id)).toEqual([
      "a",
      "b",
      "c2",
    ]);
  });

  it("excludes hidden elements", () => {
    document.body.innerHTML = `
      <div id="c">
        <button id="a">a</button>
        <button id="hidden" hidden>b</button>
        <button id="aria" aria-hidden="true">c</button>
      </div>`;

    expect(getTabbableElements(document.getElementById("c")).map((el) => el.id)).toEqual(["a"]);
  });
});

describe("getRovingItems", () => {
  it("returns every group member, including those with tabindex=-1", () => {
    // This is the reason roving focus cannot reuse FOCUSABLE_SELECTOR: inactive
    // members carry tabindex="-1" and would be filtered out entirely.
    document.body.innerHTML = `
      <div id="group">
        <div id="a" ${ROVING_ITEM_ATTRIBUTE}="" tabindex="0"></div>
        <div id="b" ${ROVING_ITEM_ATTRIBUTE}="" tabindex="-1"></div>
        <div id="other"></div>
      </div>`;

    expect(getRovingItems(document.getElementById("group")).map((el) => el.id)).toEqual(["a", "b"]);
  });

  it("returns an empty array for a missing container", () => {
    expect(getRovingItems(null)).toEqual([]);
  });
});

describe("focusElement", () => {
  it("is a no-op for null", () => {
    expect(() => focusElement(null)).not.toThrow();
  });

  it("focuses a node", () => {
    document.body.innerHTML = `<button id="a">a</button>`;
    const node = document.getElementById("a") as HTMLButtonElement;

    focusElement(node);
    expect(document.activeElement).toBe(node);
  });
});

/* ------------------------------------------------------------------ *
 * Roving focus
 * ------------------------------------------------------------------ */

function List({
  orientation = "vertical",
  loop = true,
}: {
  orientation?: "horizontal" | "vertical" | "both";
  loop?: boolean;
}) {
  const { getItemProps, handleKeyDown } = useRovingFocus({ orientation, loop });

  return (
    <div role="listbox">
      {["one", "two", "three"].map((label, index) => (
        <div
          key={label}
          role="option"
          id={label}
          {...getItemProps(index)}
          onKeyDown={handleKeyDown}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

describe("useRovingFocus", () => {
  it("gives exactly one member a tab stop", () => {
    render(<List />);
    const options = screen.getAllByRole("option");

    expect(options[0]).toHaveAttribute("tabindex", "0");
    expect(options[1]).toHaveAttribute("tabindex", "-1");
    expect(options[2]).toHaveAttribute("tabindex", "-1");
  });

  it("marks every member with the roving attribute", () => {
    render(<List />);
    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(getRovingItems(screen.getByRole("listbox"))).toHaveLength(3);
  });

  it("moves focus with arrow keys", async () => {
    const user = userEvent.setup();
    render(<List />);

    await user.tab();
    expect(document.activeElement).toBe(screen.getByText("one"));

    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(screen.getByText("two"));

    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(screen.getByText("three"));
  });

  it("moves backwards with the up arrow", async () => {
    const user = userEvent.setup();
    render(<List />);

    await user.tab();
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowUp}");

    expect(document.activeElement).toBe(screen.getByText("two"));
  });

  it("moves the tab stop with focus", async () => {
    const user = userEvent.setup();
    render(<List />);

    await user.tab();
    await user.keyboard("{ArrowDown}");

    expect(screen.getByText("two")).toHaveAttribute("tabindex", "0");
    expect(screen.getByText("one")).toHaveAttribute("tabindex", "-1");
  });

  it("wraps from last to first by default", async () => {
    const user = userEvent.setup();
    render(<List />);

    await user.tab();
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");

    expect(document.activeElement).toBe(screen.getByText("one"));
  });

  it("wraps backwards past the start", async () => {
    const user = userEvent.setup();
    render(<List />);

    await user.tab();
    await user.keyboard("{ArrowUp}");

    expect(document.activeElement).toBe(screen.getByText("three"));
  });

  it("stops at the ends when looping is disabled", async () => {
    const user = userEvent.setup();
    render(<List loop={false} />);

    await user.tab();
    await user.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(screen.getByText("one"));

    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(document.activeElement).toBe(screen.getByText("three"));
  });

  it("jumps to the ends with Home and End", async () => {
    const user = userEvent.setup();
    render(<List />);

    await user.tab();
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(screen.getByText("three"));

    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(screen.getByText("one"));
  });

  it("ignores the inline axis for a vertical list", async () => {
    const user = userEvent.setup();
    render(<List orientation="vertical" />);

    await user.tab();
    await user.keyboard("{ArrowRight}");

    expect(document.activeElement).toBe(screen.getByText("one"));
  });

  it("uses the inline axis for a horizontal list", async () => {
    const user = userEvent.setup();
    render(<List orientation="horizontal" />);

    await user.tab();
    await user.keyboard("{ArrowRight}");

    expect(document.activeElement).toBe(screen.getByText("two"));
  });

  it("uses both axes when orientation is 'both'", async () => {
    const user = userEvent.setup();
    render(<List orientation="both" />);

    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByText("two"));

    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(screen.getByText("three"));
  });

  it("ignores unrelated keys", async () => {
    const user = userEvent.setup();
    render(<List />);

    await user.tab();
    await user.keyboard("{Enter}a");

    expect(document.activeElement).toBe(screen.getByText("one"));
  });

  it("yields to a handler that called preventDefault", async () => {
    const user = userEvent.setup();

    function Guarded() {
      const { getItemProps, handleKeyDown } = useRovingFocus();
      return (
        <div role="listbox">
          {["one", "two"].map((label, index) => (
            <div
              key={label}
              role="option"
              id={label}
              {...getItemProps(index)}
              onKeyDown={(event) => {
                event.preventDefault();
                handleKeyDown(event);
              }}
            >
              {label}
            </div>
          ))}
        </div>
      );
    }

    render(<Guarded />);
    await user.tab();
    await user.keyboard("{ArrowDown}");

    expect(document.activeElement).toBe(screen.getByText("one"));
  });

  it("re-asserts a tab stop after the active item leaves the DOM", async () => {
    const user = userEvent.setup();

    function Dynamic() {
      const [count, setCount] = useState(3);
      const { getItemProps, handleKeyDown } = useRovingFocus();

      return (
        <div>
          {/* Outside the group, so it is not part of the arrow-key navigation. */}
          <button id="shrink" onClick={() => setCount(2)}>
            shrink
          </button>
          <div role="listbox">
            {Array.from({ length: count }, (_, index) => (
              <div
                key={index}
                role="option"
                id={`item-${index}`}
                {...getItemProps(index)}
                onKeyDown={handleKeyDown}
              >
                {index}
              </div>
            ))}
          </div>
        </div>
      );
    }

    render(<Dynamic />);
    await user.tab();
    await user.tab();
    await user.keyboard("{End}");
    expect(document.activeElement?.id).toBe("item-2");

    await user.click(screen.getByText("shrink"));

    expect(document.getElementById("item-2")).toBeNull();
    const remaining = getRovingItems(screen.getByRole("listbox"));
    expect(remaining).toHaveLength(2);
    // A surviving item must still be reachable by keyboard.
    expect(remaining.some((item) => item.tabIndex === 0)).toBe(true);
  });
});

/* ------------------------------------------------------------------ *
 * Focus trap
 * ------------------------------------------------------------------ */

function Trap({ active = true }: { active?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap({ active, containerRef: ref });
  return (
    <div>
      <button id="outside">outside</button>
      <div ref={ref} role="dialog" aria-label="Example dialog" id="dialog">
        <button id="first">first</button>
        <button id="last">last</button>
      </div>
    </div>
  );
}

describe("useFocusTrap", () => {
  it("focuses the first tabbable descendant on activation", () => {
    render(<Trap />);
    expect(document.activeElement?.id).toBe("first");
  });

  it("wraps focus forward from the last item", async () => {
    const user = userEvent.setup();
    render(<Trap />);

    await user.tab();
    expect(document.activeElement?.id).toBe("last");

    await user.tab();
    expect(document.activeElement?.id).toBe("first");
  });

  it("wraps focus backward from the first item", async () => {
    const user = userEvent.setup();
    render(<Trap />);

    await user.tab({ shift: true });
    expect(document.activeElement?.id).toBe("last");
  });

  it("does not trap when inactive", () => {
    render(<Trap active={false} />);
    expect(document.activeElement?.id).not.toBe("first");
  });

  it("restores focus to the opener when the trap deactivates", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button id="opener" onClick={() => setOpen(true)}>
            open
          </button>
          <button id="closer" onClick={() => setOpen(false)}>
            close
          </button>
          <Trap active={open} />
        </div>
      );
    }

    render(<Harness />);
    const opener = document.getElementById("opener") as HTMLButtonElement;
    await user.click(opener);
    expect(document.activeElement?.id).toBe("first");

    await user.click(document.getElementById("closer") as HTMLButtonElement);
    expect(document.activeElement?.id).toBe("opener");
  });

  it("makes an empty container focusable so focus cannot escape", async () => {
    const user = userEvent.setup();

    function Empty() {
      const ref = useRef<HTMLDivElement>(null);
      useFocusTrap({ active: true, containerRef: ref });
      return <div ref={ref} role="dialog" aria-label="Empty" id="empty" />;
    }

    render(<Empty />);
    expect(document.getElementById("empty")).toHaveAttribute("tabindex", "-1");
    expect(document.activeElement?.id).toBe("empty");

    await user.tab();
    expect(document.activeElement?.id).toBe("empty");
  });

  it("respects an explicit initialFocus ref", () => {
    function Custom() {
      const container = useRef<HTMLDivElement>(null);
      const target = useRef<HTMLButtonElement>(null);
      useFocusTrap({ active: true, containerRef: container, initialFocus: target });
      return (
        <div ref={container} role="dialog" aria-label="Custom">
          <button id="first">first</button>
          <button id="target" ref={target}>
            target
          </button>
        </div>
      );
    }

    render(<Custom />);
    expect(document.activeElement?.id).toBe("target");
  });

  it("accepts an initialFocus thunk", () => {
    function Thunk() {
      const container = useRef<HTMLDivElement>(null);
      useFocusTrap({
        active: true,
        containerRef: container,
        initialFocus: () => container.current?.querySelector("#target") ?? null,
      });
      return (
        <div ref={container} role="dialog" aria-label="Thunk">
          <button id="first">first</button>
          <button id="target">target</button>
        </div>
      );
    }

    render(<Thunk />);
    expect(document.activeElement?.id).toBe("target");
  });

  it("removes its keydown listener on deactivation", async () => {
    const user = userEvent.setup();
    const removeSpy = vi.spyOn(document, "removeEventListener");

    const { rerender } = render(<Trap active />);
    rerender(<Trap active={false} />);

    expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function), true);
    await user.tab();
  });
});
