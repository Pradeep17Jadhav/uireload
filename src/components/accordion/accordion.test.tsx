import { createRef } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "uireload-test";

import { Accordion, type AccordionItem } from "uireload/components/accordion";

const ITEMS: readonly AccordionItem[] = [
  { id: "one", title: "What is included?", children: <p>Everything in the base plan.</p> },
  { id: "two", title: "Can I cancel?", children: <p>At any time, from the billing page.</p> },
  {
    id: "three",
    title: "Do you offer refunds?",
    children: <p>Within 30 days, no questions asked.</p>,
  },
];

/** The header buttons, in DOM order. */
const triggers = () => screen.getAllByRole("button");
const panels = () => screen.getAllByRole("region", { hidden: true });

describe("Accordion", () => {
  it("renders one header and one panel per item", () => {
    render(<Accordion items={ITEMS} />);

    expect(triggers()).toHaveLength(3);
    expect(panels()).toHaveLength(3);
  });

  it("forwards native attributes to the root", () => {
    render(<Accordion items={ITEMS} data-testid="root" id="faq" lang="en" />);

    const root = screen.getByTestId("root");
    expect(root).toHaveAttribute("id", "faq");
    expect(root).toHaveAttribute("lang", "en");
  });

  it("merges a consumer className rather than replacing ours", () => {
    render(<Accordion items={ITEMS} data-testid="root" className="consumer-class" />);

    const root = screen.getByTestId("root");
    expect(root).toHaveClass("uir-accordion");
    expect(root).toHaveClass("consumer-class");
  });

  it("forwards its ref to the root element", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Accordion ref={ref} items={ITEMS} />);

    expect(ref.current?.tagName).toBe("DIV");
  });

  it("renders no root role, because an accordion is not a landmark", () => {
    /*
     * The pattern puts no role on the container. A `region` here would nest every panel's region inside
     * another region, which is the landmark proliferation the pattern warns about.
     */
    render(<Accordion items={ITEMS} data-testid="root" />);

    expect(screen.getByTestId("root")).not.toHaveAttribute("role");
  });

  /*
   * The three-part relationship that makes the widget navigable: the header is a heading, the button names
   * the panel, and the panel names itself after the button. If any link in that chain breaks, a screen
   * reader user can see that a panel exists but cannot tell which header owns it.
   */
  describe("ARIA wiring", () => {
    it("wraps each header in a heading", () => {
      render(<Accordion items={ITEMS} />);

      for (const button of triggers()) {
        expect(button.parentElement?.tagName).toBe("H3");
      }
    });

    it("puts the button alone inside the heading", () => {
      render(<Accordion items={ITEMS} />);

      for (const button of triggers()) {
        expect(button.parentElement?.children).toHaveLength(1);
      }
    });

    it("honours headingLevel", () => {
      render(<Accordion items={ITEMS} headingLevel={4} />);

      expect(triggers()[0]?.parentElement?.tagName).toBe("H4");
    });

    it("gives the button aria-expanded, false when collapsed", () => {
      render(<Accordion items={ITEMS} />);

      for (const button of triggers()) {
        expect(button).toHaveAttribute("aria-expanded", "false");
      }
    });

    it("points aria-controls at the panel that exists", () => {
      render(<Accordion items={ITEMS} defaultValue="two" />);

      const controls = triggers()[1]?.getAttribute("aria-controls");
      expect(controls).toBeTruthy();
      expect(document.getElementById(controls as string)).toBe(panels()[1]);
    });

    it("names each region after the button that controls it", () => {
      render(<Accordion items={ITEMS} defaultValue="one" />);

      const button = triggers()[0] as HTMLElement;
      expect(panels()[0]).toHaveAttribute("aria-labelledby", button.id);
    });

    it("uses generated ids that do not embed the consumer's item id", () => {
      /*
       * `item.id` is the caller's state key and may contain anything. Putting it in the DOM would let a
       * value with a space or a quote break the `aria-controls` pair.
       */
      render(<Accordion items={[{ id: "a b'c", title: "Odd id", children: "body" }]} />);

      const button = triggers()[0] as HTMLElement;
      expect(button.id).not.toContain(" ");
      expect(
        document.getElementById(button.getAttribute("aria-controls") as string)
      ).not.toBeNull();
    });
  });

  describe("panels", () => {
    it("hides a collapsed panel with the hidden attribute", () => {
      render(<Accordion items={ITEMS} />);

      for (const panel of panels()) {
        expect(panel).toHaveAttribute("hidden");
      }
    });

    it("reveals an expanded panel", async () => {
      const user = userEvent.setup();
      render(<Accordion items={ITEMS} />);

      await user.click(triggers()[0] as HTMLElement);

      expect(panels()[0]).not.toHaveAttribute("hidden");
      expect(panels()[1]).toHaveAttribute("hidden");
    });

    it("keeps a collapsed panel's content out of the tab sequence", () => {
      /*
       * This is why `hidden` is used rather than a CSS-only collapse: `height: 0; overflow: hidden` leaves
       * the panel's links focusable, so Tab would move through invisible content.
       *
       * jsdom has no layout and therefore no real tab order, so what is asserted is the property that
       * *causes* the correct tab order — the panel is hidden, and a link inside it is present in the DOM but
       * absent from the accessibility tree, which is what a browser excludes from sequential focus.
       */
      render(
        <Accordion items={[{ id: "one", title: "Q", children: <a href="/x">hidden link</a> }]} />
      );

      const panel = panels()[0] as HTMLElement;
      expect(panel).toHaveAttribute("hidden");
      expect(panel.querySelector("a")).not.toBeNull();
      expect(screen.queryByRole("link", { name: "hidden link" })).toBeNull();
    });

    it("exposes a link inside an expanded panel", async () => {
      const user = userEvent.setup();
      render(
        <Accordion items={[{ id: "one", title: "Q", children: <a href="/x">visible link</a> }]} />
      );

      await user.click(triggers()[0] as HTMLElement);

      expect(screen.getByRole("link", { name: "visible link" })).toBeInTheDocument();
    });
  });

  describe("single-selection mode", () => {
    it("is the default", () => {
      render(<Accordion items={ITEMS} data-testid="root" />);
      expect(screen.getByTestId("root")).toHaveAttribute("data-selection-mode", "single");
    });

    it("opens an item on click", async () => {
      const user = userEvent.setup();
      render(<Accordion items={ITEMS} />);

      await user.click(triggers()[1] as HTMLElement);
      expect(triggers()[1]).toHaveAttribute("aria-expanded", "true");
    });

    it("closes the previous item when another opens", async () => {
      const user = userEvent.setup();
      render(<Accordion items={ITEMS} defaultValue="one" />);

      await user.click(triggers()[2] as HTMLElement);

      expect(triggers()[0]).toHaveAttribute("aria-expanded", "false");
      expect(triggers()[2]).toHaveAttribute("aria-expanded", "true");
    });

    it("closes an open item on a second click, by default", async () => {
      const user = userEvent.setup();
      render(<Accordion items={ITEMS} defaultValue="one" />);

      await user.click(triggers()[0] as HTMLElement);
      expect(triggers()[0]).toHaveAttribute("aria-expanded", "false");
    });

    it("starts from defaultValue", () => {
      render(<Accordion items={ITEMS} defaultValue="three" />);
      expect(triggers()[2]).toHaveAttribute("aria-expanded", "true");
    });

    it("reports the newly open id", async () => {
      const user = userEvent.setup();
      const onExpandedChange = vi.fn();
      render(<Accordion items={ITEMS} onExpandedChange={onExpandedChange} />);

      await user.click(triggers()[0] as HTMLElement);
      expect(onExpandedChange).toHaveBeenCalledWith("one");
    });

    it("reports null when everything closes", async () => {
      const user = userEvent.setup();
      const onExpandedChange = vi.fn();
      render(<Accordion items={ITEMS} defaultValue="one" onExpandedChange={onExpandedChange} />);

      await user.click(triggers()[0] as HTMLElement);
      expect(onExpandedChange).toHaveBeenCalledWith(null);
    });
  });

  /*
   * The APG's rule: an open panel that cannot be closed gets `aria-disabled` on its header — focusable and
   * announced, but not activatable. The alternative, a header that silently swallows Enter, gives the user
   * no way to tell a disabled control from a broken one.
   */
  describe("allowAllClosed={false}", () => {
    it("marks the open header aria-disabled", () => {
      render(<Accordion items={ITEMS} defaultValue="one" allowAllClosed={false} />);

      expect(triggers()[0]).toHaveAttribute("aria-disabled", "true");
    });

    it("leaves the closed headers enabled", () => {
      render(<Accordion items={ITEMS} defaultValue="one" allowAllClosed={false} />);

      expect(triggers()[1]).not.toHaveAttribute("aria-disabled");
      expect(triggers()[1]).toBeEnabled();
    });

    it("does not close the open panel on click", async () => {
      const user = userEvent.setup();
      render(<Accordion items={ITEMS} defaultValue="one" allowAllClosed={false} />);

      await user.click(triggers()[0] as HTMLElement);
      expect(triggers()[0]).toHaveAttribute("aria-expanded", "true");
    });

    it("still allows moving to another item", async () => {
      const user = userEvent.setup();
      render(<Accordion items={ITEMS} defaultValue="one" allowAllClosed={false} />);

      await user.click(triggers()[2] as HTMLElement);

      expect(triggers()[0]).toHaveAttribute("aria-expanded", "false");
      expect(triggers()[2]).toHaveAttribute("aria-expanded", "true");
    });

    it("keeps the header focusable, unlike a disabled control", () => {
      /*
       * `aria-disabled` rather than `disabled`, precisely so the control stays in the tab sequence. A
       * wizard step you can see but never return to is a trap.
       */
      render(<Accordion items={ITEMS} defaultValue="one" allowAllClosed={false} />);

      expect(triggers()[0]).toBeEnabled();
      expect(triggers()[0]).not.toBeDisabled();
    });
  });

  describe("multiple-selection mode", () => {
    it("keeps items open independently", async () => {
      const user = userEvent.setup();
      render(<Accordion items={ITEMS} selectionMode="multiple" />);

      await user.click(triggers()[0] as HTMLElement);
      await user.click(triggers()[2] as HTMLElement);

      expect(triggers()[0]).toHaveAttribute("aria-expanded", "true");
      expect(triggers()[2]).toHaveAttribute("aria-expanded", "true");
    });

    it("closes only the clicked item", async () => {
      const user = userEvent.setup();
      render(<Accordion items={ITEMS} selectionMode="multiple" defaultValue={["one", "two"]} />);

      await user.click(triggers()[0] as HTMLElement);

      expect(triggers()[0]).toHaveAttribute("aria-expanded", "false");
      expect(triggers()[1]).toHaveAttribute("aria-expanded", "true");
    });

    it("reports the whole new set", async () => {
      const user = userEvent.setup();
      const onExpandedChange = vi.fn();
      render(
        <Accordion items={ITEMS} selectionMode="multiple" onExpandedChange={onExpandedChange} />
      );

      await user.click(triggers()[0] as HTMLElement);
      await user.click(triggers()[1] as HTMLElement);

      expect(onExpandedChange).toHaveBeenLastCalledWith(["one", "two"]);
    });

    it("never marks an open header aria-disabled, since every item can close", () => {
      render(<Accordion items={ITEMS} selectionMode="multiple" defaultValue={["one"]} />);
      expect(triggers()[0]).not.toHaveAttribute("aria-disabled");
    });
  });

  describe("controlled mode", () => {
    it("stays controlled by value", async () => {
      const user = userEvent.setup();
      render(<Accordion items={ITEMS} value="two" />);

      await user.click(triggers()[0] as HTMLElement);

      // React remains the source of truth: we report, the consumer decides.
      expect(triggers()[0]).toHaveAttribute("aria-expanded", "false");
      expect(triggers()[1]).toHaveAttribute("aria-expanded", "true");
    });

    it("reports the requested change without applying it", async () => {
      const user = userEvent.setup();
      const onExpandedChange = vi.fn();
      render(<Accordion items={ITEMS} value="two" onExpandedChange={onExpandedChange} />);

      await user.click(triggers()[0] as HTMLElement);
      expect(onExpandedChange).toHaveBeenCalledWith("one");
    });

    it("treats null as controlled-and-all-closed, unlike undefined", () => {
      const { rerender } = render(<Accordion items={ITEMS} value={null} />);
      expect(triggers()[0]).toHaveAttribute("aria-expanded", "false");

      rerender(<Accordion items={ITEMS} value="one" />);
      expect(triggers()[0]).toHaveAttribute("aria-expanded", "true");
    });

    it("renders nothing open for a value matching no item", () => {
      render(<Accordion items={ITEMS} value="does-not-exist" />);

      for (const button of triggers()) {
        expect(button).toHaveAttribute("aria-expanded", "false");
      }
    });
  });

  describe("consumer handlers", () => {
    it("lets a consumer prevent the toggle", async () => {
      const user = userEvent.setup();
      render(<Accordion items={ITEMS} onClick={(event) => event.preventDefault()} />);

      await user.click(triggers()[0] as HTMLElement);
      expect(triggers()[0]).toHaveAttribute("aria-expanded", "false");
    });

    it("still calls the consumer handler when it prevents the toggle", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
      render(<Accordion items={ITEMS} onClick={onClick} />);

      await user.click(triggers()[0] as HTMLElement);
      expect(onClick).toHaveBeenCalled();
    });

    it("receives clicks from inside a panel as well as from a header", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <Accordion
          items={[{ id: "one", title: "Q", children: <button type="button">act</button> }]}
          defaultValue="one"
          onClick={onClick}
        />
      );

      await user.click(screen.getByRole("button", { name: "act" }));
      expect(onClick).toHaveBeenCalled();
    });
  });

  describe("disabled items", () => {
    it("renders the native disabled attribute, taking the header out of the tab sequence", () => {
      render(<Accordion items={[{ ...ITEMS[0]!, disabled: true }]} />);
      expect(triggers()[0]).toBeDisabled();
    });

    it("does not toggle a disabled item", async () => {
      const user = userEvent.setup();
      render(<Accordion items={[{ ...ITEMS[0]!, disabled: true }]} />);

      await user.click(triggers()[0] as HTMLElement);
      expect(triggers()[0]).toHaveAttribute("aria-expanded", "false");
    });

    it("disables every item when the whole accordion is disabled", () => {
      render(<Accordion items={ITEMS} disabled />);

      for (const button of triggers()) {
        expect(button).toBeDisabled();
      }
    });

    it("leaves the others usable when one item is disabled", async () => {
      const user = userEvent.setup();
      render(<Accordion items={[{ ...ITEMS[0]!, disabled: true }, ITEMS[1]!]} />);

      await user.click(triggers()[1] as HTMLElement);
      expect(triggers()[1]).toHaveAttribute("aria-expanded", "true");
    });
  });

  describe("lazy", () => {
    it("does not render a collapsed panel's content", () => {
      render(
        <Accordion lazy items={[{ id: "one", title: "Q", children: <p>expensive content</p> }]} />
      );

      expect(screen.queryByText("expensive content")).not.toBeInTheDocument();
    });

    it("renders the content once the item has been opened", async () => {
      const user = userEvent.setup();
      render(
        <Accordion lazy items={[{ id: "one", title: "Q", children: <p>expensive content</p> }]} />
      );

      await user.click(triggers()[0] as HTMLElement);
      expect(screen.getByText("expensive content")).toBeInTheDocument();
    });

    it("keeps content mounted after a lazy panel is closed again", async () => {
      /*
       * `lazy` is about first render cost, not about unmounting. Re-mounting on every toggle would make
       * the second open slower than the first, which is the opposite of what a lazy component is for.
       */
      const user = userEvent.setup();
      render(
        <Accordion lazy items={[{ id: "one", title: "Q", children: <p>expensive content</p> }]} />
      );

      await user.click(triggers()[0] as HTMLElement);
      await user.click(triggers()[0] as HTMLElement);

      expect(screen.getByText("expensive content")).toBeInTheDocument();
      expect(panels()[0]).toHaveAttribute("hidden");
    });

    it("renders open panels' content immediately when not lazy", () => {
      render(
        <Accordion
          items={[{ id: "one", title: "Q", children: <p>content</p> }]}
          defaultValue="one"
        />
      );
      expect(screen.getByText("content")).toBeInTheDocument();
    });
  });

  /*
   * The pattern's keyboard table is Enter, Space and Tab. A real `<button>` provides the first two and the
   * document provides the third, so there is nothing here to implement — and nothing to add. Arrow keys
   * are deliberately absent: the pattern keeps every header and every expanded panel in the natural tab
   * sequence, so a roving-tabindex scheme would make Up and Down disagree with the Tab order in force.
   */
  describe("keyboard", () => {
    it("toggles on Enter", async () => {
      const user = userEvent.setup();
      render(<Accordion items={ITEMS} />);

      await user.tab();
      expect(triggers()[0]).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(triggers()[0]).toHaveAttribute("aria-expanded", "true");
    });

    it("toggles on Space", async () => {
      const user = userEvent.setup();
      render(<Accordion items={ITEMS} />);

      await user.tab();
      await user.keyboard(" ");

      expect(triggers()[0]).toHaveAttribute("aria-expanded", "true");
    });

    it("puts every enabled header in the natural tab sequence, with no roving tabindex", async () => {
      const user = userEvent.setup();
      render(<Accordion items={ITEMS} />);

      await user.tab();
      expect(triggers()[0]).toHaveFocus();

      await user.tab();
      expect(triggers()[1]).toHaveFocus();

      await user.tab();
      expect(triggers()[2]).toHaveFocus();
    });

    it("gives no header a positive tabindex", () => {
      render(<Accordion items={ITEMS} />);

      for (const button of triggers()) {
        expect(button.getAttribute("tabindex")).toBeNull();
      }
    });

    it("steps past a disabled header", async () => {
      const user = userEvent.setup();
      render(<Accordion items={[{ ...ITEMS[0]!, disabled: true }, ITEMS[1]!]} />);

      await user.tab();
      expect(triggers()[1]).toHaveFocus();
    });
  });

  it("marks size and variant as data attributes", () => {
    render(<Accordion items={ITEMS} data-testid="root" size="lg" variant="plain" />);

    const root = screen.getByTestId("root");
    expect(root).toHaveAttribute("data-size", "lg");
    expect(root).toHaveAttribute("data-variant", "plain");
  });

  it("marks an expanded item on both the item and its trigger", () => {
    render(<Accordion items={ITEMS} defaultValue="two" data-testid="root" />);

    const item = triggers()[1]?.closest(".uir-accordion__item");
    expect(item).toHaveAttribute("data-expanded", "");
    expect(triggers()[1]).toHaveAttribute("data-expanded", "");
  });

  it("keeps item state out of the class name", () => {
    render(<Accordion items={[{ ...ITEMS[0]!, tone: "danger" }]} defaultValue="one" />);

    const item = triggers()[0]?.closest(".uir-accordion__item") as HTMLElement;
    expect(item.getAttribute("class")).toBe("uir-accordion__item");
    expect(item).toHaveAttribute("data-tone", "danger");
  });

  it("applies an item tone without affecting its siblings", () => {
    render(<Accordion items={[{ ...ITEMS[0]!, tone: "danger" }, ITEMS[1]!]} />);

    const [first, second] = screen.getAllByRole("button");
    expect(first?.closest(".uir-accordion__item")).toHaveAttribute("data-tone", "danger");
    expect(second?.closest(".uir-accordion__item")).not.toHaveAttribute("data-tone");
  });

  it("renders inside an RTL subtree", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Accordion items={ITEMS} data-testid="root" />, { dir: "rtl" });

    const host = screen.getByTestId("root").parentElement as HTMLElement;
    expect(host).toHaveAttribute("dir", "rtl");

    await user.click(triggers()[0] as HTMLElement);
    expect(triggers()[0]).toHaveAttribute("aria-expanded", "true");
  });

  it("renders under the high-contrast scheme", () => {
    renderWithProviders(<Accordion items={ITEMS} defaultValue="one" />, {
      scheme: "high-contrast",
    });

    const host = screen.getAllByRole("button")[0]?.closest(".uir-accordion")?.parentElement;
    expect(host).toHaveAttribute("data-uir-scheme", "high-contrast");
  });

  it("keeps panel content associated with its own header under RTL", () => {
    renderWithProviders(<Accordion items={ITEMS} defaultValue="one" />, { dir: "rtl" });

    const button = triggers()[0] as HTMLElement;
    const region = within(document.body).getAllByRole("region")[0] as HTMLElement;
    expect(region).toHaveAttribute("aria-labelledby", button.id);
  });
});
