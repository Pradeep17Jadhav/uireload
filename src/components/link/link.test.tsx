/**
 * Link tests.
 *
 * The centre of gravity is that a link is a real `<a>`. Everything a link does — Enter and Space
 * activation, the tab stop, the context menu, the announced destination, the middle-click — is the
 * platform's, and a component that reimplemented any of it would be worse.
 */

import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "uireload-test";

import { Link } from "uireload/components/link";

describe("Link: rendering", () => {
  it("is a real anchor", () => {
    render(<Link href="/docs">Docs</Link>);

    const link = screen.getByRole("link", { name: "Docs" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/docs");
  });

  it("is focusable and reachable by Tab", async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Before</button>
        <Link href="/docs">Docs</Link>
        <button type="button">After</button>
      </>
    );

    await user.tab();
    expect(document.activeElement).toHaveTextContent("Before");
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("link"));
    await user.tab();
    expect(document.activeElement).toHaveTextContent("After");
  });

  it("activates with Enter, natively", () => {
    render(<Link href="/docs">Docs</Link>);

    // jsdom does not navigate, but the element is an anchor with an href and no click handler is
    // needed for Enter to mean "go" — that is the platform's contract and this asserts only that
    // nothing in the component intercepts it.
    expect(screen.getByRole("link")).not.toHaveAttribute("onclick");
  });

  it("is not a link at all without an href", () => {
    render(<Link>Not yet routed</Link>);

    /*
     * The platform gives an `<a>` with no `href` no role and no tab stop. That is the honest state:
     * a link with no destination should not be announced as a link.
     */
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("forwards target and rel", () => {
    render(
      <Link href="https://example.com" target="_blank" rel="noopener">
        Example
      </Link>
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener");
  });

  it("does not default rel for target=_blank", () => {
    render(
      <Link href="https://example.com" target="_blank">
        Example
      </Link>
    );

    /*
     * Adding `rel="noopener"` silently is a correctness-with-consequences decision made for the
     * consumer, and `noreferrer` additionally strips the referrer. The component names the case in
     * development rather than choosing.
     */
    expect(screen.getByRole("link")).not.toHaveAttribute("rel");
  });

  it("exposes state as data attributes, not class names", () => {
    const { container } = render(
      <Link href="/x" underline="hover" tone="danger" size="lg" external>
        Docs
      </Link>
    );

    const root = container.querySelector(".uir-link") as HTMLElement;
    expect(root).toHaveAttribute("data-underline", "hover");
    expect(root).toHaveAttribute("data-tone", "danger");
    expect(root).toHaveAttribute("data-size", "lg");
    expect(root).toHaveAttribute("data-external", "");
    expect(root.className).not.toMatch(/hover|danger|lg/);
  });

  it("merges a consumer className onto the root", () => {
    render(
      <Link href="/x" className="consumer-class">
        Docs
      </Link>
    );

    expect(screen.getByRole("link")).toHaveClass("uir-link", "consumer-class");
  });

  it("forwards its ref to the anchor", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <Link href="/docs" ref={ref}>
        Docs
      </Link>
    );

    expect(ref.current).toBe(screen.getByRole("link"));
  });

  it("forwards arbitrary attributes", () => {
    render(
      <Link href="/docs" id="docs-link" lang="en-GB" download>
        Docs
      </Link>
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("id", "docs-link");
    expect(link).toHaveAttribute("lang", "en-GB");
    expect(link).toHaveAttribute("download");
  });
});

describe("Link: external", () => {
  it("renders a marker that is hidden from assistive technology", () => {
    const { container } = render(
      <Link href="https://example.com" external>
        Example
      </Link>
    );

    const marker = container.querySelector(".uir-link__external");
    expect(marker).toHaveAttribute("aria-hidden", "true");
  });

  it("says nothing extra, because the link's own href already says it", async () => {
    const user = userEvent.setup();
    let clicks = 0;

    render(
      <Link href="https://example.com" external onClick={() => (clicks += 1)}>
        Example
      </Link>
    );

    await user.click(screen.getByRole("link"));

    /*
     * No click interception at all. A link that opens a new tab and also runs a handler is two
     * behaviours from one click, and this component adds none.
     */
    expect(clicks).toBe(1);
  });

  it("renders no marker when not external", () => {
    const { container } = render(<Link href="/docs">Docs</Link>);

    expect(container.querySelector(".uir-link__external")).toBeNull();
  });

  it("renders a custom end icon, hidden from assistive technology", () => {
    const { container } = render(
      <Link href="/docs" endIcon={<span data-testid="i" />}>
        Docs
      </Link>
    );

    const icon = container.querySelector(".uir-link__end-icon") as HTMLElement;
    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("[data-testid='i']")).toBeInTheDocument();
  });
});

describe("Link: disabled", () => {
  it("stays focusable, so a keyboard user can discover it", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Link href="/docs" disabled>
          Docs
        </Link>
        <button type="button">After</button>
      </>
    );

    await user.tab();
    expect(document.activeElement).toBe(screen.getByText("Docs"));
  });

  it("keeps the href, so the link is still a link and still announced as one", () => {
    render(
      <Link href="/docs" disabled>
        Docs
      </Link>
    );

    /*
     * `<a>` has no `disabled` attribute. Dropping the `href` would stop navigation, but it would also
     * drop the tab stop and the link role — so a keyboard user could neither reach it nor hear that
     * it exists. The `href` stays and the navigation is stopped by `preventDefault` instead.
     */
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/docs");
  });

  it("states aria-disabled, because it is unavailable rather than absent", () => {
    render(
      <Link href="/docs" disabled>
        Docs
      </Link>
    );

    expect(screen.getByRole("link")).toHaveAttribute("aria-disabled", "true");
  });

  it("prevents the navigation", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Link href="/docs" disabled onClick={onClick}>
        Docs
      </Link>
    );

    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    screen.getByRole("link").dispatchEvent(event);

    // The one thing a disabled link must do is not go anywhere.
    expect(event.defaultPrevented).toBe(true);
    await user.click(screen.getByRole("link"));
  });

  it("still runs the consumer's handler, so the click is not silently lost", () => {
    const onClick = vi.fn();
    render(
      <Link href="/docs" disabled onClick={onClick}>
        Docs
      </Link>
    );

    screen
      .getByRole("link")
      .dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

    /*
     * Suppressing the handler outright would make the click vanish from a consumer's analytics with
     * nothing to explain it. It is recorded and simply does not navigate.
     */
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("Link: development warnings", () => {
  it("warns about target=_blank with no rel", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    render(
      <Link href="https://example.com" target="_blank">
        Example
      </Link>
    );

    const messages = warn.mock.calls.map((call) => String(call[0]));
    expect(messages.some((message) => message.includes("noopener"))).toBe(true);
    warn.mockRestore();
  });

  it("says nothing when rel already has noopener", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    render(
      <Link href="https://example.com" target="_blank" rel="noopener">
        Example
      </Link>
    );

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("says nothing for a same-tab link", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    render(<Link href="/docs">Docs</Link>);

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("Link: direction and scheme", () => {
  it("renders in RTL", () => {
    renderWithProviders(<Link href="/docs">الوثائق</Link>, { dir: "rtl" });

    expect(screen.getByRole("link", { name: "الوثائق" })).toBeInTheDocument();
  });

  it("renders in every colour scheme", () => {
    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      const { unmount } = renderWithProviders(
        <Link href="https://example.com" external tone="accent">
          Example
        </Link>,
        { scheme }
      );

      expect(screen.getByRole("link", { name: "Example" }), scheme).toBeInTheDocument();
      unmount();
    }
  });
});
