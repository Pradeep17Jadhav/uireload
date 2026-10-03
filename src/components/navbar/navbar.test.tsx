import { createRef } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "uireload-test";

import { Navbar, type NavbarItem } from "uireload/components/navbar";

const ITEMS: readonly NavbarItem[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "projects", label: "Projects", href: "/projects" },
  { id: "settings", label: "Settings", href: "/settings" },
];

describe("Navbar", () => {
  it("renders a navigation landmark with a name", () => {
    render(<Navbar items={ITEMS} label="Main" />);

    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(nav.tagName).toBe("NAV");
  });

  /*
   * The default name.
   *
   * A `<nav>` with no name is announced as "navigation" and nothing else, so on a page with a secondary bar
   * the two are indistinguishable. "Main" is right more often than not, which is why it is a default rather
   * than a required prop — but it is a default, not a fixed value.
   */
  it("falls back to the catalogue name when no label is given", () => {
    render(<Navbar items={ITEMS} />);
    expect(screen.getByRole("navigation")).toHaveAttribute("aria-label", "Main");
  });

  it("renders the items as a list, so a screen reader user can navigate it as one", () => {
    render(<Navbar items={ITEMS} label="Main" />);

    const list = within(screen.getByRole("navigation")).getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
  });

  it("renders a destination as a real link", () => {
    render(<Navbar items={ITEMS} label="Main" />);

    const link = screen.getByRole("link", { name: "Projects" });
    expect(link).toHaveAttribute("href", "/projects");
  });

  it("forwards native attributes to the root", () => {
    render(<Navbar items={ITEMS} label="Main" data-testid="root" id="main-nav" lang="en" />);

    const root = screen.getByTestId("root");
    expect(root).toHaveAttribute("id", "main-nav");
    expect(root).toHaveAttribute("lang", "en");
  });

  it("merges a consumer className rather than replacing ours", () => {
    render(<Navbar items={ITEMS} label="Main" className="consumer-class" />);

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveClass("uir-navbar");
    expect(nav).toHaveClass("consumer-class");
  });

  it("forwards its ref to the root element", () => {
    const ref = createRef<HTMLElement>();
    render(<Navbar ref={ref} items={ITEMS} />);

    expect(ref.current?.tagName).toBe("NAV");
  });

  /*
   * "Where am I?" must be answerable without reading every link, and `aria-current="page"` is how.
   */
  describe("the current page", () => {
    it("marks the item with aria-current when set on the item", () => {
      render(<Navbar items={[{ ...ITEMS[1]!, current: true }]} label="Main" />);

      expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute(
        "aria-current",
        "page"
      );
    });

    it("marks the item named by the current prop", () => {
      render(<Navbar items={ITEMS} current="settings" label="Main" />);

      expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
        "aria-current",
        "page"
      );
      expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
    });

    it("lets the current prop override a stale item flag", () => {
      /*
       * A consumer holding one piece of state should not have to copy it into every item on every render, so
       * the prop wins rather than being merged with `item.current`.
       */
      render(
        <Navbar
          items={[{ ...ITEMS[0]!, current: true }, ...ITEMS.slice(1)]}
          current="settings"
          label="Main"
        />
      );

      expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
      expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
        "aria-current",
        "page"
      );
    });

    it("marks nothing when no page is current", () => {
      render(<Navbar items={ITEMS} label="Main" />);

      expect(screen.queryAllByRole("link")).toHaveLength(3);
      for (const link of screen.getAllByRole("link")) {
        expect(link).not.toHaveAttribute("aria-current");
      }
    });

    it("emits a data attribute as well, so CSS owns the styling", () => {
      render(<Navbar items={ITEMS} current="home" label="Main" />);
      expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("data-current", "");
    });

    it("keeps the state out of the class name", () => {
      render(<Navbar items={ITEMS} current="home" label="Main" />);
      expect(screen.getByRole("link", { name: "Home" }).className).toBe("uir-navbar__link");
    });
  });

  /*
   * The element choice per item.
   *
   * A destination navigates and an action performs. Rendering "Sign out" as a link is a claim the browser
   * will try to follow, and it cannot be middle-clicked or copied.
   */
  describe("honest elements", () => {
    it("renders an action with no href as a button, not a link", () => {
      render(
        <Navbar items={[{ id: "signout", label: "Sign out", onSelect: () => {} }]} label="Main" />
      );

      expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Sign out" })).toBeNull();
    });

    it("renders an item with neither href nor onSelect as inert text", () => {
      /*
       * A section name that is not yet a page. As a link with no `href` it would be focusable and do nothing;
       * as a button it would announce a control that performs no action.
       */
      render(<Navbar items={[{ id: "soon", label: "Coming soon" }]} label="Main" />);

      expect(screen.queryByRole("link")).toBeNull();
      expect(screen.queryByRole("button")).toBeNull();
      expect(screen.getByText("Coming soon")).toBeInTheDocument();
    });

    it("gives the inert entry no pointer affordance", () => {
      render(<Navbar items={[{ id: "soon", label: "Coming soon" }]} label="Main" />);

      // The entry, not the label span inside it — `getByText` returns the innermost match.
      expect(screen.getByText("Coming soon").closest(".uir-navbar__link")).toHaveClass(
        "uir-navbar__link--static"
      );
    });

    it("mixes links, buttons and text in one list", () => {
      render(
        <Navbar
          items={[
            { id: "home", label: "Home", href: "/" },
            { id: "signout", label: "Sign out", onSelect: () => {} },
            { id: "soon", label: "Soon" },
          ]}
          label="Main"
        />
      );

      expect(screen.getByRole("list")).toBeInTheDocument();
      expect(screen.getAllByRole("listitem")).toHaveLength(3);
    });

    it("calls an item's own onSelect and then reports to onNavigate", async () => {
      const user = userEvent.setup();
      const order: string[] = [];

      render(
        <Navbar
          items={[{ id: "save", label: "Save", onSelect: () => order.push("item") }]}
          onNavigate={() => order.push("navbar")}
          label="Main"
        />
      );

      await user.click(screen.getByRole("button", { name: "Save" }));
      expect(order).toEqual(["item", "navbar"]);
    });

    it("reports an activated link by id", async () => {
      const user = userEvent.setup();
      const onNavigate = vi.fn();

      render(<Navbar items={ITEMS} onNavigate={onNavigate} label="Main" />);
      await user.click(screen.getByRole("link", { name: "Projects" }));

      expect(onNavigate).toHaveBeenCalledWith("projects");
    });
  });

  /*
   * A disabled link and a disabled button are deliberately different.
   *
   * A `<button>` has a native `disabled` and using it removes the control from the tab sequence, which is
   * right for a control that cannot be used.
   *
   * A link has no such attribute, and dropping the `href` instead would be worse than useless: an `<a>`
   * without an `href` has no implicit link *role*, so the item would leave the accessibility tree entirely
   * rather than being marked unavailable. `aria-disabled` keeps it present, focusable and announced as
   * unavailable, and `preventDefault()` stops the navigation.
   */
  describe("disabled items", () => {
    it("keeps a disabled link present and focusable, but marked unavailable", () => {
      render(<Navbar items={[{ ...ITEMS[0]!, disabled: true }]} label="Main" />);

      const link = screen.getByRole("link", { name: "Home" });
      expect(link).toHaveAttribute("aria-disabled", "true");
      // Still a link, still has its destination, still in the tab sequence.
      expect(link).toHaveAttribute("href", "/");
      expect(link).not.toHaveAttribute("tabindex");
    });

    it("does not report a disabled link to onNavigate", async () => {
      const user = userEvent.setup();
      const onNavigate = vi.fn();

      render(
        <Navbar items={[{ ...ITEMS[0]!, disabled: true }]} onNavigate={onNavigate} label="Main" />
      );
      await user.click(screen.getByRole("link", { name: "Home" }));

      expect(onNavigate).not.toHaveBeenCalled();
    });

    it("uses the native disabled attribute on a button", () => {
      render(
        <Navbar
          items={[{ id: "save", label: "Save", onSelect: () => {}, disabled: true }]}
          label="Main"
        />
      );

      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    });

    it("disables every item when the whole navbar is disabled", () => {
      render(<Navbar items={ITEMS} disabled label="Main" />);

      for (const link of screen.getAllByRole("link")) {
        expect(link).toHaveAttribute("aria-disabled", "true");
        // The href survives: removing it would remove the link role, not just the ability to follow it.
        expect(link).toHaveAttribute("href");
      }
    });

    it("leaves the others usable when one item is disabled", async () => {
      const user = userEvent.setup();
      const onNavigate = vi.fn();

      render(
        <Navbar
          items={[{ ...ITEMS[0]!, disabled: true }, ITEMS[1]!]}
          onNavigate={onNavigate}
          label="Main"
        />
      );

      await user.click(screen.getByRole("link", { name: "Projects" }));
      expect(onNavigate).toHaveBeenCalledWith("projects");
    });
  });

  /*
   * There is no widget pattern here, so there is no arrow-key contract.
   *
   * `Tab` moving through the links is the whole keyboard story. Adding Up/Down would make `Tab` mean something
   * different on this component than on every other list of links on the page, and the authoring practices
   * define no such pattern for navigation.
   */
  describe("keyboard", () => {
    it("moves through the links with Tab, in order", async () => {
      const user = userEvent.setup();
      render(<Navbar items={ITEMS} label="Main" />);

      await user.tab();
      expect(screen.getByRole("link", { name: "Home" })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole("link", { name: "Projects" })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole("link", { name: "Settings" })).toHaveFocus();
    });

    it("gives no link a positive tabindex", () => {
      render(<Navbar items={ITEMS} label="Main" />);

      for (const link of screen.getAllByRole("link")) {
        const tabIndex = link.getAttribute("tabindex");
        expect(tabIndex === null || Number(tabIndex) <= 0).toBe(true);
      }
    });

    it("activates a link on Enter", async () => {
      const user = userEvent.setup();
      const onNavigate = vi.fn();

      render(<Navbar items={ITEMS} onNavigate={onNavigate} label="Main" />);

      await user.tab();
      await user.keyboard("{Enter}");
      expect(onNavigate).toHaveBeenCalledWith("home");
    });
  });

  it("renders brand and actions around the list", () => {
    render(
      <Navbar
        items={ITEMS}
        label="Main"
        brand={<span>Acme</span>}
        actions={<button type="button">Sign in</button>}
      />
    );

    const nav = screen.getByRole("navigation");
    expect(within(nav).getByText("Acme")).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("marks orientation and position as data attributes", () => {
    render(
      <Navbar
        items={ITEMS}
        label="Main"
        orientation="vertical"
        position="sticky"
        data-testid="root"
      />
    );

    const root = screen.getByTestId("root");
    expect(root).toHaveAttribute("data-orientation", "vertical");
    expect(root).toHaveAttribute("data-position", "sticky");
  });

  it("defaults to a horizontal, static bar at md", () => {
    render(<Navbar items={ITEMS} label="Main" data-testid="root" />);

    const root = screen.getByTestId("root");
    expect(root).toHaveAttribute("data-orientation", "horizontal");
    expect(root).toHaveAttribute("data-position", "static");
    expect(root).toHaveAttribute("data-size", "md");
  });

  it("hides an icon from assistive technology, because label is the name", () => {
    render(<Navbar items={[{ ...ITEMS[0]!, icon: "★" }]} label="Main" />);

    const link = screen.getByRole("link", { name: "Home" });
    expect(link.querySelector(".uir-navbar__icon")).toHaveAttribute("aria-hidden", "true");
  });

  it("lets a consumer prevent activation", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(
      <Navbar
        items={ITEMS}
        label="Main"
        onNavigate={onNavigate}
        onClick={(event) => event.preventDefault()}
      />
    );

    await user.click(screen.getByRole("link", { name: "Projects" }));
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("still calls the consumer handler when it prevents activation", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());

    render(<Navbar items={ITEMS} label="Main" onClick={onClick} />);
    await user.click(screen.getByRole("link", { name: "Projects" }));

    expect(onClick).toHaveBeenCalled();
  });

  it("mirrors in an RTL subtree", () => {
    renderWithProviders(<Navbar items={ITEMS} label="Main" current="home" />, { dir: "rtl" });

    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
  });

  it("renders under the high-contrast scheme", () => {
    renderWithProviders(<Navbar items={ITEMS} label="Main" current="home" />, {
      scheme: "high-contrast",
    });

    const host = screen.getByRole("navigation").parentElement;
    expect(host).toHaveAttribute("data-uir-scheme", "high-contrast");
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("data-current", "");
  });
});
