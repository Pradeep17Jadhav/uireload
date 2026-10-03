/**
 * Avatar tests.
 *
 * The centre of gravity is the image-failed path, because an avatar's image failing is normal rather
 * than exceptional — a revoked gravatar, a moved file — and a broken-image glyph is a worse answer
 * than the initials the component already has.
 */

import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "uireload-test";

import { Avatar, initialsFrom } from "uireload/components/avatar";

/** The rendered image, when there is one. */
function image(): HTMLImageElement | null {
  return document.querySelector(".uir-avatar__image");
}

describe("Avatar: initials", () => {
  it("takes two initials from a first and last name", () => {
    expect(initialsFrom("Ada Lovelace")).toBe("AL");
  });

  it("takes one initial from a single name", () => {
    expect(initialsFrom("Ada")).toBe("AD");
  });

  it("takes two characters from a single short name", () => {
    expect(initialsFrom("Al")).toBe("AL");
  });

  it("uses only the first character of a one-character name", () => {
    expect(initialsFrom("A")).toBe("A");
  });

  it("takes the first and last of a middle name", () => {
    // "Augusta Ada King" → "AK", not "AA": the last word is the surname, not the middle one.
    expect(initialsFrom("Augusta Ada King")).toBe("AK");
  });

  it("collapses runs of whitespace", () => {
    expect(initialsFrom("  Ada   Lovelace  ")).toBe("AL");
  });

  it("returns nothing for an empty name", () => {
    expect(initialsFrom("   ")).toBe("");
  });

  it("renders the initials", () => {
    const { container } = render(<Avatar initials="AL" />);

    expect(container.querySelector(".uir-avatar__initials")).toHaveTextContent("AL");
  });
});

describe("Avatar: image", () => {
  it("renders a real image", () => {
    render(<Avatar src="/ada.png" alt="Ada Lovelace" />);

    const img = image();
    expect(img).toHaveAttribute("src", "/ada.png");
    expect(img).toHaveAttribute("alt", "Ada Lovelace");
  });

  it("renders the image with an empty alt when decorative", () => {
    render(<Avatar src="/a.png" alt="" />);

    // `alt=""` is not a missing alt; it is the correct declaration that the image carries no
    // information, because the name is already visible beside it.
    expect(image()).toHaveAttribute("alt", "");
  });

  it("falls back to initials when the image fails", () => {
    const { container } = render(<Avatar src="/gone.png" alt="Ada" initials="AL" />);
    expect(image()).toBeInTheDocument();

    fireEvent.error(image() as HTMLImageElement);

    // A revoked gravatar is not an error message; it is a reason to show the initials.
    expect(image()).toBeNull();
    expect(container.querySelector(".uir-avatar__initials")).toHaveTextContent("AL");
  });

  it("recovers when the source changes to a working image", () => {
    render(<Avatar src="/broken.png" alt="Ada" initials="AL" />);
    fireEvent.error(image() as HTMLImageElement);
    expect(image()).toBeNull();

    // A new source is a new chance, so the failed flag must not survive it.
    const { rerender } = render(<Avatar src="/working.png" alt="Ada" initials="AL" key="b" />);
    rerender(<Avatar src="/working.png" alt="Ada" initials="AL" />);
    expect(image()).toHaveAttribute("src", "/working.png");
  });

  it("hides the initials when an image is showing and alt names the person", () => {
    const { container } = render(<Avatar src="/ada.png" alt="Ada Lovelace" initials="AL" />);

    /*
     * Both would otherwise be announced — "Ada Lovelace, AL" — and the letters say nothing the alt does
     * not. When there is no alt, the initials are the name.
     */
    expect(container.querySelector(".uir-avatar__initials")).toBeNull();
  });

  it("says nothing of its own when the image is decorative", () => {
    const { container } = render(<Avatar src="/a.png" alt="" initials="AL" />);

    /*
     * The image and the initials are alternatives, never both: an `alt=""` avatar is one where the
     * name is already visible beside it, which is exactly what the consumer declared by passing it.
     * Rendering the initials as well would announce "AL" beside a name that already says who this is.
     */
    expect(container.querySelector(".uir-avatar__initials")).toBeNull();
    expect(image()).toHaveAttribute("alt", "");
  });

  it("renders the empty glyph with neither image nor initials", () => {
    const { container } = render(<Avatar />);

    expect(container.querySelector(".uir-avatar__glyph")).toBeInTheDocument();
  });

  it("marks that it has an image", () => {
    render(<Avatar src="/a.png" alt="A" />);

    expect(document.querySelector(".uir-avatar")).toHaveAttribute("data-has-image", "");
  });
});

describe("Avatar: interactive", () => {
  it("is a div by default", () => {
    const { container } = render(<Avatar initials="AL" />);

    expect((container.querySelector(".uir-avatar") as HTMLElement).tagName).toBe("DIV");
  });

  it("has no tab stop by default", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Avatar initials="AL" />
        <button type="button">After</button>
      </>
    );

    await user.tab();
    expect(document.activeElement).toHaveTextContent("After");
  });

  it("is a button when interactive", () => {
    render(<Avatar interactive initials="AL" />);

    // One tab stop, Space and Enter activate it natively — none of which a div gets without a
    // tabIndex, a role and a keydown handler written by hand.
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("is type=button, never submit", () => {
    render(<Avatar interactive initials="AL" />);

    // An avatar in a toolbar inside a form that defaulted to submit would submit the form.
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("activates with Space and Enter, natively", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Avatar interactive initials="AL" onClick={onClick} />);

    screen.getByRole("button").focus();
    await user.keyboard(" ");
    await user.keyboard("{Enter}");

    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("calls onClick exactly once per click", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Avatar interactive initials="AL" onClick={onClick} />);

    await user.click(screen.getByRole("button"));

    // No internal click behaviour to compose with; composing would call it twice.
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does nothing when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Avatar interactive disabled initials="AL" onClick={onClick} />);

    await user.click(screen.getByRole("button"));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("is skipped by Tab when disabled", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Avatar interactive disabled initials="AL" />
        <button type="button">After</button>
      </>
    );

    await user.tab();
    expect(document.activeElement).toHaveTextContent("After");
  });
});

describe("Avatar: presentation", () => {
  it("exposes state as data attributes, not class names", () => {
    const { container } = render(
      <Avatar initials="AL" variant="rounded" size="lg" tone="danger" />
    );

    const root = container.querySelector(".uir-avatar") as HTMLElement;
    expect(root).toHaveAttribute("data-variant", "rounded");
    expect(root).toHaveAttribute("data-size", "lg");
    expect(root).toHaveAttribute("data-tone", "danger");
    expect(root.className).not.toMatch(/rounded|lg|danger/);
  });

  it("merges a consumer className onto the root", () => {
    const { container } = render(<Avatar initials="AL" className="consumer-class" />);

    expect(container.querySelector(".uir-avatar")).toHaveClass("uir-avatar", "consumer-class");
  });

  it("hides the badge from assistive technology", () => {
    render(<Avatar initials="AL" badge={<span data-testid="b">3</span>} />);

    // A presence dot has no announcement, and a count that matters belongs in the name or beside it.
    const badge = document.querySelector(".uir-avatar__badge");
    expect(badge).toHaveAttribute("aria-hidden", "true");
  });

  it("forwards its ref", () => {
    const ref = createRef<HTMLElement>();
    render(<Avatar ref={ref} initials="AL" />);

    expect(ref.current).toBe(document.querySelector(".uir-avatar"));
  });
});

describe("Avatar: direction and scheme", () => {
  it("renders in RTL", () => {
    renderWithProviders(<Avatar initials="ع" />, { dir: "rtl" });

    expect(document.querySelector(".uir-avatar")).toBeInTheDocument();
  });

  it("renders in every colour scheme", () => {
    for (const scheme of ["light", "dark", "high-contrast"] as const) {
      const { unmount } = renderWithProviders(<Avatar initials="AL" tone="accent" />, { scheme });

      expect(document.querySelector(".uir-avatar"), scheme).toBeInTheDocument();
      unmount();
    }
  });
});
